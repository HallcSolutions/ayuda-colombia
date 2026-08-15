import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  RecoveryApplicationStatus,
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../common/constants/app.constants';
import {
  PublishedRecoveryProject,
  RecoveryAccessEntry,
  RecoveryAccessRequest,
  RecoveryApplication,
  RecoveryHelperProfile,
  RecoveryProject,
  RecoveryTask,
  RecoveryVerificationQueue,
  RegisteredRecoveryHelper,
} from '../common/interfaces/recovery.interface';
import { createEditPin, matchesEditPin } from '../common/security/edit-pin';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { CreateRecoveryApplicationDto } from './dto/create-recovery-application.dto';
import { CreateRecoveryProjectDto } from './dto/create-recovery-project.dto';
import { CreateRecoveryTaskDto } from './dto/create-recovery-task.dto';
import { FindRecoveryProjectsQueryDto } from './dto/find-recovery-projects-query.dto';
import { RecoverRecoveryAccessDto } from './dto/recover-recovery-access.dto';
import { RegisterRecoveryHelperDto } from './dto/register-recovery-helper.dto';
import { ReviewRecoveryProjectDto } from './dto/review-recovery-project.dto';
import { ReviewRecoveryTaskDto } from './dto/review-recovery-task.dto';
import { UpdateRecoveryApplicationDto } from './dto/update-recovery-application.dto';
import { UpdateRecoveryProjectDto } from './dto/update-recovery-project.dto';
import { UpdateRecoveryTaskDto } from './dto/update-recovery-task.dto';
import { RecoveryApplicationEntity } from './infrastructure/entities/recovery-application.entity';
import { RecoveryHelperEntity } from './infrastructure/entities/recovery-helper.entity';
import { RecoveryProjectEntity } from './infrastructure/entities/recovery-project.entity';
import { RecoveryTaskEntity } from './infrastructure/entities/recovery-task.entity';
import { RecoveryAccessMailer } from './recovery-access.mailer';
import { RecoveryGateway } from './recovery.gateway';

/** El correo se guarda siempre igual para poder buscar por él al recuperar el acceso. */
const normalizeEmail = (value = ''): string => value.trim().toLowerCase();

const PUBLIC_PROJECT_STATUSES = [
  RecoveryProjectStatus.OPEN,
  RecoveryProjectStatus.IN_PROGRESS,
  RecoveryProjectStatus.PAUSED,
  RecoveryProjectStatus.COMPLETED,
];

const ACTIVE_APPLICATION_STATUSES = [
  RecoveryApplicationStatus.PENDING,
  RecoveryApplicationStatus.ACCEPTED,
  RecoveryApplicationStatus.COMPLETED,
];

const RISK_RANK: Record<RecoveryRiskLevel, number> = {
  [RecoveryRiskLevel.GREEN]: 1,
  [RecoveryRiskLevel.AMBER]: 2,
  [RecoveryRiskLevel.RED]: 3,
};

const RED_CATEGORIES = new Set<RecoveryTaskCategory>([
  RecoveryTaskCategory.STRUCTURAL,
  RecoveryTaskCategory.ELECTRICAL,
  RecoveryTaskCategory.GAS,
]);

/**
 * Necesidades que se resuelven entregando una cosa. No hay riesgo físico que
 * clasificar, así que se publican de inmediato: quien necesita una silla de
 * ruedas no puede esperar a una cola de revisión.
 */
const DONATION_CATEGORIES = new Set<RecoveryTaskCategory>([
  RecoveryTaskCategory.ASSISTIVE_DEVICE,
  RecoveryTaskCategory.HOUSEHOLD_GOODS,
  RecoveryTaskCategory.MATERIALS,
  RecoveryTaskCategory.FOOD,
]);

const AMBER_CATEGORIES = new Set<RecoveryTaskCategory>([
  RecoveryTaskCategory.CONSTRUCTION,
  RecoveryTaskCategory.PLUMBING,
  RecoveryTaskCategory.CARPENTRY,
  RecoveryTaskCategory.WELDING,
  RecoveryTaskCategory.EQUIPMENT_REPAIR,
]);

@Injectable()
export class RecoveryService {
  constructor(
    @InjectRepository(RecoveryProjectEntity)
    private readonly projects: Repository<RecoveryProjectEntity>,
    @InjectRepository(RecoveryTaskEntity)
    private readonly tasks: Repository<RecoveryTaskEntity>,
    @InjectRepository(RecoveryHelperEntity)
    private readonly helpers: Repository<RecoveryHelperEntity>,
    @InjectRepository(RecoveryApplicationEntity)
    private readonly applications: Repository<RecoveryApplicationEntity>,
    private readonly gateway: RecoveryGateway,
    private readonly photoStorage: PhotoStorageService,
    private readonly mailer: RecoveryAccessMailer,
  ) {}

  async findProjects(
    filters: FindRecoveryProjectsQueryDto,
  ): Promise<RecoveryProject[]> {
    const query = this.projects
      .createQueryBuilder('project')
      .where('project.status IN (:...statuses)', {
        statuses:
          filters.status && PUBLIC_PROJECT_STATUSES.includes(filters.status)
            ? [filters.status]
            : PUBLIC_PROJECT_STATUSES,
      })
      .orderBy('project.updatedAt', 'DESC');
    if (filters.kind)
      query.andWhere('project.kind = :kind', { kind: filters.kind });
    if (filters.department) {
      query.andWhere('LOWER(project.department) = LOWER(:department)', {
        department: filters.department,
      });
    }
    if (filters.municipality) {
      query.andWhere('LOWER(project.municipality) = LOWER(:municipality)', {
        municipality: filters.municipality,
      });
    }
    return this.attachTasks(await query.getMany());
  }

  async findProject(id: string): Promise<RecoveryProject> {
    const entity = await this.findProjectEntity(id);
    if (!PUBLIC_PROJECT_STATUSES.includes(entity.status)) {
      throw new NotFoundException(
        'El proyecto de recuperación no está disponible públicamente',
      );
    }
    return (await this.attachTasks([entity]))[0];
  }

  async createProject(
    dto: CreateRecoveryProjectDto,
    files: Express.Multer.File[] = [],
  ): Promise<PublishedRecoveryProject> {
    if (!dto.consentToVerification) {
      throw new BadRequestException(
        'Debes autorizar la publicación de los datos indicados',
      );
    }
    const editPin = createEditPin();
    const photos = await this.photoStorage.store(files);
    let entity: RecoveryProjectEntity;
    try {
      entity = await this.projects.save(
        this.projects.create({
          kind: dto.kind,
          name: dto.name.trim(),
          story: dto.story.trim(),
          organizerName: dto.organizerName.trim(),
          contactPhone: dto.contactPhone.trim(),
          contactEmail: normalizeEmail(dto.contactEmail),
          department: dto.department.trim(),
          municipality: dto.municipality.trim(),
          areaReference: dto.areaReference.trim(),
          productsOrServices: dto.productsOrServices?.trim() ?? '',
          priceReference: dto.priceReference?.trim() ?? '',
          salesModes: [...new Set(dto.salesModes ?? [])],
          schedule: dto.schedule?.trim() ?? '',
          photos,
          // Publicar el teléfono lo decide quien publica, no el tipo de caso:
          // sin contacto directo, una donación se queda esperando trámites.
          shareContactPublicly: Boolean(dto.shareContactPublicly),
          status: RecoveryProjectStatus.OPEN,
          verifiedBy: '',
          verifiedAt: null,
          editPinHash: editPin.hash,
        }),
      );
    } catch (error) {
      await this.photoStorage.remove(photos);
      throw error;
    }
    const project = this.toProject(entity, []);
    this.gateway.projectCreated(project);
    return {
      ...project,
      editPin: editPin.pin,
      accessEmailSent: await this.mailer.sendAccess(
        entity.contactEmail,
        [this.projectAccess(entity, editPin.pin)],
        'published',
      ),
    };
  }

  async updateProject(
    id: string,
    dto: UpdateRecoveryProjectDto,
    editPin: string,
  ): Promise<RecoveryProject> {
    const entity = await this.findProjectEntity(id);
    this.assertPin(
      editPin,
      entity.editPinHash,
      'El PIN del proyecto no es correcto',
    );
    const allowed = [
      RecoveryProjectStatus.OPEN,
      RecoveryProjectStatus.IN_PROGRESS,
      RecoveryProjectStatus.PAUSED,
      RecoveryProjectStatus.COMPLETED,
    ];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        'Ese estado no puede ser elegido por quien publicó el caso',
      );
    }
    entity.status = dto.status;
    await this.projects.save(entity);
    const project = await this.findProject(id);
    this.gateway.projectUpdated(project);
    return project;
  }

  async createTask(
    projectId: string,
    dto: CreateRecoveryTaskDto,
    editPin: string,
  ): Promise<RecoveryTask> {
    const project = await this.findProjectEntity(projectId);
    this.assertPin(
      editPin,
      project.editPinHash,
      'El PIN del proyecto no es correcto',
    );
    const riskLevel = this.minimumRisk(dto.category);
    const entity = await this.tasks.save(
      this.tasks.create({
        projectId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category,
        riskLevel,
        status: DONATION_CATEGORIES.has(dto.category)
          ? RecoveryTaskStatus.OPEN
          : RecoveryTaskStatus.PENDING_REVIEW,
        peopleNeeded: dto.peopleNeeded,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        durationHours: dto.durationHours ?? null,
        skillsRequired: dto.skillsRequired?.trim() ?? '',
        materialsNeeded: dto.materialsNeeded?.trim() ?? '',
        professionalRequired: riskLevel === RecoveryRiskLevel.RED,
        reviewedBy: '',
        reviewedAt: null,
      }),
    );
    await this.publishProject(projectId);
    return this.toTask(entity, []);
  }

  async updateTask(
    projectId: string,
    taskId: string,
    dto: UpdateRecoveryTaskDto,
    editPin: string,
  ): Promise<RecoveryTask> {
    const project = await this.findProjectEntity(projectId);
    this.assertPin(
      editPin,
      project.editPinHash,
      'El PIN del proyecto no es correcto',
    );
    const task = await this.findTaskEntity(taskId);
    if (task.projectId !== projectId)
      throw new NotFoundException('La tarea no pertenece al proyecto');
    const allowed = [
      RecoveryTaskStatus.IN_PROGRESS,
      RecoveryTaskStatus.COMPLETED,
      RecoveryTaskStatus.CANCELLED,
    ];
    if (
      task.status === RecoveryTaskStatus.PENDING_REVIEW ||
      !allowed.includes(dto.status)
    ) {
      throw new BadRequestException(
        'La tarea debe estar publicada antes de cambiar su estado',
      );
    }
    task.status = dto.status;
    await this.tasks.save(task);
    await this.publishProject(projectId);
    return this.toTask(task, await this.applications.findBy({ taskId }));
  }

  async registerHelper(
    dto: RegisterRecoveryHelperDto,
  ): Promise<RegisteredRecoveryHelper> {
    if (!dto.consentToShareContact) {
      throw new BadRequestException(
        'Debes autorizar que tu contacto se entregue a quien pide ayuda',
      );
    }
    const editPin = createEditPin();
    const entity = await this.helpers.save(
      this.helpers.create({
        displayName: dto.displayName.trim(),
        contactPhone: dto.contactPhone.trim(),
        contactEmail: normalizeEmail(dto.contactEmail),
        department: dto.department.trim(),
        municipality: dto.municipality.trim(),
        skills: [...new Set(dto.skills)],
        editPinHash: editPin.hash,
      }),
    );
    return {
      ...this.toHelperProfile(entity),
      editPin: editPin.pin,
      accessEmailSent: await this.mailer.sendAccess(
        entity.contactEmail,
        [this.helperAccess(entity, editPin.pin)],
        'published',
      ),
    };
  }

  /**
   * Devuelve por correo el acceso de todo lo publicado con esa dirección. El PIN solo
   * se guarda cifrado, así que no se puede reenviar: se genera uno nuevo y el anterior
   * deja de servir. La respuesta nunca revela si el correo estaba registrado.
   */
  async recoverAccess({
    email,
  }: RecoverRecoveryAccessDto): Promise<RecoveryAccessRequest> {
    if (!this.mailer.available) {
      throw new ServiceUnavailableException(
        'El envío de correos no está disponible en este momento',
      );
    }
    const contactEmail = normalizeEmail(email);
    const [projects, helpers] = await Promise.all([
      this.projects.findBy({ contactEmail }),
      this.helpers.findBy({ contactEmail }),
    ]);
    const entries = [
      ...projects.map((project) =>
        this.projectAccess(project, this.resetPin(project)),
      ),
      ...helpers.map((helper) =>
        this.helperAccess(helper, this.resetPin(helper)),
      ),
    ];
    // El PIN nuevo solo sustituye al anterior si el correo salió de verdad: si el
    // envío falla, quien publicó conserva el acceso que ya tenía.
    if (
      entries.length &&
      (await this.mailer.sendAccess(contactEmail, entries, 'recovered'))
    ) {
      await Promise.all([
        this.projects.save(projects),
        this.helpers.save(helpers),
      ]);
    }
    return { requested: true };
  }

  /** Cambia la llave guardada de la publicación y devuelve el PIN nuevo en claro. */
  private resetPin(entity: { editPinHash: string }): string {
    const editPin = createEditPin();
    entity.editPinHash = editPin.hash;
    return editPin.pin;
  }

  private projectAccess(
    project: RecoveryProjectEntity,
    pin: string,
  ): RecoveryAccessEntry {
    return {
      title: project.name,
      codeLabel: 'Código del proyecto',
      code: project.id,
      pin,
    };
  }

  private helperAccess(
    helper: RecoveryHelperEntity,
    pin: string,
  ): RecoveryAccessEntry {
    return {
      title: helper.displayName,
      codeLabel: 'Código de ayudante',
      code: helper.id,
      pin,
    };
  }

  async getHelper(id: string, editPin: string): Promise<RecoveryHelperProfile> {
    const helper = await this.findHelperEntity(id);
    this.assertPin(
      editPin,
      helper.editPinHash,
      'El PIN de la persona voluntaria no es correcto',
    );
    return this.toHelperProfile(helper);
  }

  async applyToTask(
    taskId: string,
    dto: CreateRecoveryApplicationDto,
    helperPin: string,
  ): Promise<RecoveryApplication> {
    const task = await this.findTaskEntity(taskId, ['project']);
    const helper = await this.findHelperEntity(dto.helperId);
    this.assertPin(
      helperPin,
      helper.editPinHash,
      'El PIN de la persona voluntaria no es correcto',
    );
    if (task.status !== RecoveryTaskStatus.OPEN) {
      throw new BadRequestException(
        'La tarea todavía no está abierta para recibir ayuda',
      );
    }
    this.assertHelperCanPerform(helper, task);
    if (await this.applications.existsBy({ taskId, helperId: helper.id })) {
      throw new ConflictException('Ya te postulaste a esta tarea');
    }
    const entity = await this.applications.save(
      this.applications.create({
        taskId,
        helperId: helper.id,
        message: dto.message.trim(),
        availability: dto.availability.trim(),
        status: RecoveryApplicationStatus.PENDING,
      }),
    );
    await this.publishProject(task.projectId);
    entity.task = task;
    entity.helper = helper;
    return this.toApplication(entity, 'helper');
  }

  async getProjectApplications(
    projectId: string,
    editPin: string,
  ): Promise<RecoveryApplication[]> {
    const project = await this.findProjectEntity(projectId);
    this.assertPin(
      editPin,
      project.editPinHash,
      'El PIN del proyecto no es correcto',
    );
    const entities = await this.applications
      .createQueryBuilder('application')
      .innerJoinAndSelect('application.task', 'task')
      .innerJoinAndSelect('task.project', 'project')
      .innerJoinAndSelect('application.helper', 'helper')
      .where('task.projectId = :projectId', { projectId })
      .orderBy('application.createdAt', 'DESC')
      .getMany();
    return entities.map((entity) => this.toApplication(entity, 'project'));
  }

  async getHelperApplications(
    helperId: string,
    editPin: string,
  ): Promise<RecoveryApplication[]> {
    const helper = await this.findHelperEntity(helperId);
    this.assertPin(
      editPin,
      helper.editPinHash,
      'El PIN de la persona voluntaria no es correcto',
    );
    const entities = await this.applications.find({
      where: { helperId },
      relations: { task: { project: true }, helper: true },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toApplication(entity, 'helper'));
  }

  async updateApplication(
    projectId: string,
    applicationId: string,
    dto: UpdateRecoveryApplicationDto,
    projectPin: string,
  ): Promise<RecoveryApplication> {
    const project = await this.findProjectEntity(projectId);
    this.assertPin(
      projectPin,
      project.editPinHash,
      'El PIN del proyecto no es correcto',
    );
    const application = await this.findApplicationEntity(applicationId);
    if (application.task.projectId !== projectId) {
      throw new NotFoundException(
        'La postulación no pertenece a este proyecto',
      );
    }
    const allowed = [
      RecoveryApplicationStatus.ACCEPTED,
      RecoveryApplicationStatus.DECLINED,
      RecoveryApplicationStatus.COMPLETED,
    ];
    if (!allowed.includes(dto.status))
      throw new BadRequestException('Estado de postulación inválido');
    if (dto.status === RecoveryApplicationStatus.ACCEPTED) {
      this.assertHelperCanPerform(application.helper, application.task);
      const accepted = await this.applications.count({
        where: {
          taskId: application.taskId,
          status: In([
            RecoveryApplicationStatus.ACCEPTED,
            RecoveryApplicationStatus.COMPLETED,
          ]),
        },
      });
      if (
        application.status !== RecoveryApplicationStatus.ACCEPTED &&
        accepted >= application.task.peopleNeeded
      ) {
        throw new ConflictException(
          'La tarea ya tiene todas las personas necesarias',
        );
      }
    }
    application.status = dto.status;
    await this.applications.save(application);
    await this.publishProject(projectId);
    return this.toApplication(application, 'project');
  }

  async withdrawApplication(
    applicationId: string,
    helperPin: string,
  ): Promise<RecoveryApplication> {
    const application = await this.findApplicationEntity(applicationId);
    this.assertPin(
      helperPin,
      application.helper.editPinHash,
      'El PIN de la persona voluntaria no es correcto',
    );
    if (
      ![
        RecoveryApplicationStatus.PENDING,
        RecoveryApplicationStatus.ACCEPTED,
      ].includes(application.status)
    ) {
      throw new BadRequestException('Esta postulación ya no se puede retirar');
    }
    application.status = RecoveryApplicationStatus.WITHDRAWN;
    await this.applications.save(application);
    await this.publishProject(application.task.projectId);
    return this.toApplication(application, 'helper');
  }

  async verificationQueue(): Promise<RecoveryVerificationQueue> {
    const [projects, tasks] = await Promise.all([
      this.projects.find({
        where: [
          { status: RecoveryProjectStatus.PENDING_REVIEW },
          { status: RecoveryProjectStatus.OPEN, verifiedAt: IsNull() },
        ],
        order: { createdAt: 'ASC' },
      }),
      this.tasks.find({
        where: { status: RecoveryTaskStatus.PENDING_REVIEW },
        relations: { project: true },
        order: { createdAt: 'ASC' },
      }),
    ]);
    return {
      projects: projects.map((project) => ({
        id: project.id,
        kind: project.kind,
        name: project.name,
        story: project.story,
        organizerName: project.organizerName,
        contactPhone: project.contactPhone,
        department: project.department,
        municipality: project.municipality,
        areaReference: project.areaReference,
        productsOrServices: project.productsOrServices,
        priceReference: project.priceReference,
        salesModes: project.salesModes,
        schedule: project.schedule,
        photos: project.photos,
        shareContactPublicly: project.shareContactPublicly,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
      })),
      tasks: tasks.map((task) => ({
        id: task.id,
        projectId: task.projectId,
        projectName: task.project.name,
        organizerName: task.project.organizerName,
        contactPhone: task.project.contactPhone,
        department: task.project.department,
        municipality: task.project.municipality,
        title: task.title,
        description: task.description,
        category: task.category,
        riskLevel: task.riskLevel,
        status: task.status,
        peopleNeeded: task.peopleNeeded,
        skillsRequired: task.skillsRequired,
        materialsNeeded: task.materialsNeeded,
        createdAt: task.createdAt.toISOString(),
      })),
    };
  }

  async reviewProject(
    id: string,
    dto: ReviewRecoveryProjectDto,
  ): Promise<RecoveryProject> {
    const entity = await this.findProjectEntity(id);
    if (
      ![RecoveryProjectStatus.OPEN, RecoveryProjectStatus.REJECTED].includes(
        dto.status,
      )
    ) {
      throw new BadRequestException(
        'La moderación solo puede verificar o retirar la publicación',
      );
    }
    entity.status = dto.status;
    entity.verifiedBy = dto.verifiedBy.trim();
    entity.verifiedAt =
      dto.status === RecoveryProjectStatus.OPEN ? new Date() : null;
    await this.projects.save(entity);
    const project = this.toProject(entity, []);
    this.gateway.projectUpdated(project);
    return project;
  }

  async reviewTask(
    id: string,
    dto: ReviewRecoveryTaskDto,
  ): Promise<RecoveryTask> {
    const task = await this.findTaskEntity(id, ['project']);
    if (
      ![RecoveryTaskStatus.OPEN, RecoveryTaskStatus.BLOCKED].includes(
        dto.status,
      )
    ) {
      throw new BadRequestException(
        'La revisión solo puede abrir o bloquear la tarea',
      );
    }
    if (
      !task.project.verifiedAt ||
      !PUBLIC_PROJECT_STATUSES.includes(task.project.status)
    ) {
      throw new BadRequestException('Primero debe aprobarse el proyecto');
    }
    const minimumRisk = this.minimumRisk(task.category);
    if (RISK_RANK[dto.riskLevel] < RISK_RANK[minimumRisk]) {
      throw new BadRequestException(
        'El nivel de riesgo no puede ser menor al mínimo de ese oficio',
      );
    }
    task.riskLevel = dto.riskLevel;
    task.professionalRequired = dto.riskLevel === RecoveryRiskLevel.RED;
    task.status = dto.status;
    task.reviewedBy = dto.reviewedBy.trim();
    task.reviewedAt = new Date();
    await this.tasks.save(task);
    await this.publishProject(task.projectId);
    return this.toTask(task, []);
  }

  /**
   * Nadie comprueba a quien se ofrece: lo único que se exige es que la ayuda
   * que declaró corresponda con lo que la tarea pide.
   */
  private assertHelperCanPerform(
    helper: RecoveryHelperEntity,
    task: RecoveryTaskEntity,
  ): void {
    if (!helper.skills.includes(task.category)) {
      throw new UnauthorizedException('No te ofreciste para ese tipo de ayuda');
    }
  }

  private minimumRisk(category: RecoveryTaskCategory): RecoveryRiskLevel {
    if (RED_CATEGORIES.has(category)) return RecoveryRiskLevel.RED;
    if (AMBER_CATEGORIES.has(category)) return RecoveryRiskLevel.AMBER;
    return RecoveryRiskLevel.GREEN;
  }

  private async attachTasks(
    projects: RecoveryProjectEntity[],
  ): Promise<RecoveryProject[]> {
    if (!projects.length) return [];
    const projectIds = projects.map((project) => project.id);
    const taskEntities = await this.tasks
      .createQueryBuilder('task')
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .andWhere('task.status != :cancelled', {
        cancelled: RecoveryTaskStatus.CANCELLED,
      })
      .orderBy('task.createdAt', 'ASC')
      .getMany();
    const publishedTasks = taskEntities.filter(
      (task) => task.status !== RecoveryTaskStatus.PENDING_REVIEW,
    );
    const taskIds = publishedTasks.map((task) => task.id);
    const applications = taskIds.length
      ? await this.applications.find({
          where: {
            taskId: In(taskIds),
            status: In(ACTIVE_APPLICATION_STATUSES),
          },
        })
      : [];
    return projects.map((project) =>
      this.toProject(
        project,
        publishedTasks
          .filter((task) => task.projectId === project.id)
          .map((task) =>
            this.toTask(
              task,
              applications.filter((item) => item.taskId === task.id),
            ),
          ),
        taskEntities.filter(
          (task) =>
            task.projectId === project.id &&
            task.status === RecoveryTaskStatus.PENDING_REVIEW,
        ).length,
      ),
    );
  }

  private toProject(
    entity: RecoveryProjectEntity,
    tasks: RecoveryTask[],
    pendingTaskCount = 0,
  ): RecoveryProject {
    return {
      id: entity.id,
      kind: entity.kind,
      name: entity.name,
      story: entity.story,
      department: entity.department,
      municipality: entity.municipality,
      areaReference: entity.areaReference,
      productsOrServices: entity.productsOrServices,
      priceReference: entity.priceReference,
      salesModes: entity.salesModes,
      schedule: entity.schedule,
      photos: entity.photos,
      publicContactPhone: entity.shareContactPublicly
        ? entity.contactPhone
        : '',
      status: entity.status,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt?.toISOString() ?? null,
      pendingTaskCount,
      tasks,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toTask(
    entity: RecoveryTaskEntity,
    applications: RecoveryApplicationEntity[],
  ): RecoveryTask {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      category: entity.category,
      riskLevel: entity.riskLevel,
      status: entity.status,
      peopleNeeded: entity.peopleNeeded,
      acceptedHelpers: applications.filter((item) =>
        [
          RecoveryApplicationStatus.ACCEPTED,
          RecoveryApplicationStatus.COMPLETED,
        ].includes(item.status),
      ).length,
      applicationCount: applications.filter(
        (item) => item.status === RecoveryApplicationStatus.PENDING,
      ).length,
      scheduledFor: entity.scheduledFor?.toISOString() ?? null,
      durationHours: entity.durationHours,
      skillsRequired: entity.skillsRequired,
      materialsNeeded: entity.materialsNeeded,
      professionalRequired: entity.professionalRequired,
      reviewedBy: entity.reviewedBy,
      reviewedAt: entity.reviewedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toHelperProfile(entity: RecoveryHelperEntity): RecoveryHelperProfile {
    return {
      id: entity.id,
      displayName: entity.displayName,
      department: entity.department,
      municipality: entity.municipality,
      skills: entity.skills,
    };
  }

  private toApplication(
    entity: RecoveryApplicationEntity,
    viewer: 'project' | 'helper',
  ): RecoveryApplication {
    const accepted = [
      RecoveryApplicationStatus.ACCEPTED,
      RecoveryApplicationStatus.COMPLETED,
    ].includes(entity.status);
    return {
      id: entity.id,
      projectId: entity.task.projectId,
      projectName: entity.task.project.name,
      taskId: entity.taskId,
      taskTitle: entity.task.title,
      helperId: entity.helperId,
      helperName: entity.helper.displayName,
      helperPhone:
        viewer === 'project' && accepted ? entity.helper.contactPhone : '',
      helperSkills: entity.helper.skills,
      message: entity.message,
      availability: entity.availability,
      status: entity.status,
      projectContactName:
        viewer === 'helper' && accepted
          ? entity.task.project.organizerName
          : '',
      projectContactPhone:
        viewer === 'helper' && accepted ? entity.task.project.contactPhone : '',
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private async publishProject(projectId: string): Promise<void> {
    try {
      this.gateway.projectUpdated(await this.findProject(projectId));
    } catch {
      // Los proyectos pendientes no deben salir por el socket público.
    }
  }

  private assertPin(received: string, hash: string, message: string): void {
    if (!received || !matchesEditPin(received, hash))
      throw new UnauthorizedException(message);
  }

  private async findProjectEntity(id: string): Promise<RecoveryProjectEntity> {
    const entity = await this.projects.findOneBy({ id });
    if (!entity)
      throw new NotFoundException('El proyecto de recuperación no existe');
    return entity;
  }

  private async findTaskEntity(
    id: string,
    relations: string[] = [],
  ): Promise<RecoveryTaskEntity> {
    const entity = await this.tasks.findOne({ where: { id }, relations });
    if (!entity)
      throw new NotFoundException('La tarea de recuperación no existe');
    return entity;
  }

  private async findHelperEntity(id: string): Promise<RecoveryHelperEntity> {
    const entity = await this.helpers.findOneBy({ id });
    if (!entity) throw new NotFoundException('La persona voluntaria no existe');
    return entity;
  }

  private async findApplicationEntity(
    id: string,
  ): Promise<RecoveryApplicationEntity> {
    const entity = await this.applications.findOne({
      where: { id },
      relations: { task: { project: true }, helper: true },
    });
    if (!entity) throw new NotFoundException('La postulación no existe');
    return entity;
  }
}
