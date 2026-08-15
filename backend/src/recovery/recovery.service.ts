import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  HelperCredentialType,
  HelperVerificationLevel,
  HelperVerificationMethod,
  RecoveryApplicationStatus,
  RecoveryProjectKind,
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../common/constants/app.constants';
import {
  PublishedRecoveryProject,
  RecoveryApplication,
  RecoveryHelperProfile,
  RecoveryProject,
  RecoveryTask,
  RecoveryVerificationQueue,
  RegisteredRecoveryHelper,
} from '../common/interfaces/recovery.interface';
import { createEditPin, matchesEditPin } from '../common/security/edit-pin';
import { CreateRecoveryApplicationDto } from './dto/create-recovery-application.dto';
import { CreateRecoveryProjectDto } from './dto/create-recovery-project.dto';
import { CreateRecoveryTaskDto } from './dto/create-recovery-task.dto';
import { FindRecoveryProjectsQueryDto } from './dto/find-recovery-projects-query.dto';
import { RegisterRecoveryHelperDto } from './dto/register-recovery-helper.dto';
import { ReviewRecoveryHelperDto } from './dto/review-recovery-helper.dto';
import { ReviewRecoveryProjectDto } from './dto/review-recovery-project.dto';
import { ReviewRecoveryTaskDto } from './dto/review-recovery-task.dto';
import { UpdateRecoveryApplicationDto } from './dto/update-recovery-application.dto';
import { UpdateRecoveryProjectDto } from './dto/update-recovery-project.dto';
import { UpdateRecoveryTaskDto } from './dto/update-recovery-task.dto';
import { RecoveryApplicationEntity } from './infrastructure/entities/recovery-application.entity';
import { RecoveryHelperEntity } from './infrastructure/entities/recovery-helper.entity';
import { RecoveryProjectEntity } from './infrastructure/entities/recovery-project.entity';
import { RecoveryTaskEntity } from './infrastructure/entities/recovery-task.entity';
import { RecoveryGateway } from './recovery.gateway';

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

const VERIFICATION_RANK: Partial<Record<HelperVerificationLevel, number>> = {
  [HelperVerificationLevel.IDENTITY]: 1,
  [HelperVerificationLevel.TRADE]: 2,
  [HelperVerificationLevel.PROFESSIONAL]: 3,
};

const RED_CATEGORIES = new Set<RecoveryTaskCategory>([
  RecoveryTaskCategory.STRUCTURAL,
  RecoveryTaskCategory.ELECTRICAL,
  RecoveryTaskCategory.GAS,
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
  ): Promise<PublishedRecoveryProject> {
    if (!dto.consentToVerification) {
      throw new BadRequestException(
        'Debes autorizar la publicación de los datos indicados',
      );
    }
    const editPin = createEditPin();
    const entity = await this.projects.save(
      this.projects.create({
        kind: dto.kind,
        name: dto.name.trim(),
        story: dto.story.trim(),
        organizerName: dto.organizerName.trim(),
        contactPhone: dto.contactPhone.trim(),
        department: dto.department.trim(),
        municipality: dto.municipality.trim(),
        areaReference: dto.areaReference.trim(),
        productsOrServices: dto.productsOrServices?.trim() ?? '',
        priceReference: dto.priceReference?.trim() ?? '',
        salesModes: [...new Set(dto.salesModes ?? [])],
        schedule: dto.schedule?.trim() ?? '',
        shareContactPublicly:
          this.isCommerce(dto.kind) && Boolean(dto.shareContactPublicly),
        status: RecoveryProjectStatus.OPEN,
        verifiedBy: '',
        verifiedAt: null,
        editPinHash: editPin.hash,
      }),
    );
    const project = this.toProject(entity, []);
    this.gateway.projectCreated(project);
    return { ...project, editPin: editPin.pin };
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
        status: RecoveryTaskStatus.PENDING_REVIEW,
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
    if (!task.reviewedAt || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        'La tarea debe ser revisada antes de cambiar su estado',
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
    if (!dto.consentToVerification) {
      throw new BadRequestException(
        'Debes autorizar la verificación privada de identidad y oficio',
      );
    }
    if (
      dto.credentialType === HelperCredentialType.PROFESSIONAL_LICENSE &&
      (!dto.credentialNumber?.trim() || !dto.credentialIssuer?.trim())
    ) {
      throw new BadRequestException(
        'La matrícula profesional requiere número y entidad emisora',
      );
    }
    const editPin = createEditPin();
    const entity = await this.helpers.save(
      this.helpers.create({
        fullName: dto.fullName.trim(),
        displayName: dto.displayName.trim(),
        documentType: dto.documentType.trim(),
        documentNumber: dto.documentNumber.trim(),
        contactPhone: dto.contactPhone.trim(),
        department: dto.department.trim(),
        municipality: dto.municipality.trim(),
        skills: [...new Set(dto.skills)],
        verifiedSkills: [],
        bio: dto.bio?.trim() ?? '',
        yearsExperience: dto.yearsExperience,
        credentialType: dto.credentialType,
        credentialNumber: dto.credentialNumber?.trim() ?? '',
        credentialIssuer: dto.credentialIssuer?.trim() ?? '',
        referenceName: dto.referenceName?.trim() ?? '',
        referencePhone: dto.referencePhone?.trim() ?? '',
        verificationLevel: HelperVerificationLevel.PENDING,
        verificationMethod: null,
        verifiedBy: '',
        verifiedAt: null,
        verificationNotes: '',
        verificationSourceName: '',
        verificationSourceUrl: '',
        editPinHash: editPin.hash,
      }),
    );
    return { ...this.toHelperProfile(entity), editPin: editPin.pin };
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
    if (task.status !== RecoveryTaskStatus.OPEN || !task.reviewedAt) {
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
    const [projects, tasks, helpers] = await Promise.all([
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
      this.helpers.find({
        where: { verificationLevel: HelperVerificationLevel.PENDING },
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
      helpers: helpers.map((helper) => ({
        id: helper.id,
        fullName: helper.fullName,
        displayName: helper.displayName,
        documentType: helper.documentType,
        documentNumber: helper.documentNumber,
        contactPhone: helper.contactPhone,
        department: helper.department,
        municipality: helper.municipality,
        skills: helper.skills,
        bio: helper.bio,
        yearsExperience: helper.yearsExperience,
        credentialType: helper.credentialType,
        credentialNumber: helper.credentialNumber,
        credentialIssuer: helper.credentialIssuer,
        referenceName: helper.referenceName,
        referencePhone: helper.referencePhone,
        verificationLevel: helper.verificationLevel,
        createdAt: helper.createdAt.toISOString(),
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

  async reviewHelper(
    id: string,
    dto: ReviewRecoveryHelperDto,
  ): Promise<RecoveryHelperProfile> {
    const helper = await this.findHelperEntity(id);
    const allowed = [
      HelperVerificationLevel.IDENTITY,
      HelperVerificationLevel.TRADE,
      HelperVerificationLevel.PROFESSIONAL,
      HelperVerificationLevel.REJECTED,
      HelperVerificationLevel.SUSPENDED,
    ];
    if (!allowed.includes(dto.verificationLevel)) {
      throw new BadRequestException('Nivel de verificación inválido');
    }
    const verifiedSkills = [...new Set(dto.verifiedSkills)];
    if (verifiedSkills.some((skill) => !helper.skills.includes(skill))) {
      throw new BadRequestException(
        'No se puede verificar un oficio que la persona no declaró',
      );
    }
    this.assertVerificationEvidence(helper, dto);
    helper.verificationLevel = dto.verificationLevel;
    helper.verificationMethod = dto.verificationMethod ?? null;
    const grantsTradeAccess =
      dto.verificationLevel === HelperVerificationLevel.TRADE ||
      dto.verificationLevel === HelperVerificationLevel.PROFESSIONAL;
    helper.verifiedSkills = grantsTradeAccess ? verifiedSkills : [];
    helper.verifiedBy = dto.verifiedBy.trim();
    helper.verifiedAt = [
      HelperVerificationLevel.REJECTED,
      HelperVerificationLevel.SUSPENDED,
    ].includes(dto.verificationLevel)
      ? null
      : new Date();
    helper.verificationNotes = dto.verificationNotes?.trim() ?? '';
    helper.verificationSourceName = grantsTradeAccess
      ? (dto.verificationSourceName?.trim() ?? '')
      : '';
    helper.verificationSourceUrl =
      dto.verificationLevel === HelperVerificationLevel.PROFESSIONAL
        ? (dto.verificationSourceUrl?.trim() ?? '')
        : '';
    await this.helpers.save(helper);
    return this.toHelperProfile(helper);
  }

  private assertVerificationEvidence(
    helper: RecoveryHelperEntity,
    dto: ReviewRecoveryHelperDto,
  ): void {
    if (
      [
        HelperVerificationLevel.REJECTED,
        HelperVerificationLevel.SUSPENDED,
      ].includes(dto.verificationLevel)
    ) {
      return;
    }
    if (!dto.verificationMethod)
      throw new BadRequestException('Debes registrar cómo se verificó');
    if (
      dto.verificationLevel === HelperVerificationLevel.IDENTITY &&
      dto.verificationMethod !== HelperVerificationMethod.IDENTITY_AND_PHONE
    ) {
      throw new BadRequestException(
        'La verificación básica debe confirmar identidad y teléfono',
      );
    }
    if (dto.verificationLevel === HelperVerificationLevel.TRADE) {
      const validMethods = [
        HelperVerificationMethod.TRAINING_CERTIFICATE,
        HelperVerificationMethod.EMPLOYER_REFERENCE,
        HelperVerificationMethod.COMMUNITY_REFERENCE,
        HelperVerificationMethod.PRACTICAL_ASSESSMENT,
      ];
      if (!validMethods.includes(dto.verificationMethod)) {
        throw new BadRequestException('Ese método no comprueba un oficio');
      }
      if (helper.credentialType === HelperCredentialType.NONE) {
        throw new BadRequestException(
          'Para validar un oficio se requiere certificado o referencia comprobable',
        );
      }
      if (!dto.verificationSourceName?.trim()) {
        throw new BadRequestException(
          'Debes registrar la fuente o persona con la que comprobaste el oficio',
        );
      }
    }
    if (dto.verificationLevel === HelperVerificationLevel.PROFESSIONAL) {
      if (
        dto.verificationMethod !== HelperVerificationMethod.OFFICIAL_REGISTRY ||
        helper.credentialType !== HelperCredentialType.PROFESSIONAL_LICENSE ||
        !helper.credentialNumber ||
        !helper.credentialIssuer
      ) {
        throw new BadRequestException(
          'Un profesional solo se valida consultando su matrícula en fuente oficial',
        );
      }
      const sourceName = dto.verificationSourceName?.trim();
      const sourceUrl = dto.verificationSourceUrl?.trim();
      if (!sourceName || !sourceUrl || !this.isTrustedRegistryUrl(sourceUrl)) {
        throw new BadRequestException(
          'La validación profesional requiere nombre y enlace HTTPS de un registro oficial autorizado',
        );
      }
    }
  }

  private isTrustedRegistryUrl(value: string): boolean {
    const trustedDomains = (process.env.RECOVERY_TRUSTED_REGISTRY_DOMAINS ?? '')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
    if (!trustedDomains.length) return false;
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      return (
        url.protocol === 'https:' &&
        trustedDomains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
        )
      );
    } catch {
      return false;
    }
  }

  private assertHelperCanPerform(
    helper: RecoveryHelperEntity,
    task: RecoveryTaskEntity,
  ): void {
    const level = VERIFICATION_RANK[helper.verificationLevel] ?? 0;
    const required = RISK_RANK[task.riskLevel];
    if (level < required) {
      throw new UnauthorizedException(
        'Tu nivel de verificación no permite asumir esta tarea',
      );
    }
    const skills =
      task.riskLevel === RecoveryRiskLevel.GREEN
        ? helper.skills
        : helper.verifiedSkills;
    if (!skills.includes(task.category)) {
      throw new UnauthorizedException(
        'Ese oficio no fue comprobado para tu perfil',
      );
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
    const tasks = await this.tasks
      .createQueryBuilder('task')
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .andWhere('task.reviewedAt IS NOT NULL')
      .andWhere('task.status != :cancelled', {
        cancelled: RecoveryTaskStatus.CANCELLED,
      })
      .orderBy('task.createdAt', 'ASC')
      .getMany();
    const taskIds = tasks.map((task) => task.id);
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
        tasks
          .filter((task) => task.projectId === project.id)
          .map((task) =>
            this.toTask(
              task,
              applications.filter((item) => item.taskId === task.id),
            ),
          ),
      ),
    );
  }

  private toProject(
    entity: RecoveryProjectEntity,
    tasks: RecoveryTask[],
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
      publicContactPhone:
        entity.shareContactPublicly && this.isCommerce(entity.kind)
          ? entity.contactPhone
          : '',
      status: entity.status,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt?.toISOString() ?? null,
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
      verifiedSkills: entity.verifiedSkills,
      bio: entity.bio,
      yearsExperience: entity.yearsExperience,
      verificationLevel: entity.verificationLevel,
      verificationMethod: entity.verificationMethod,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt?.toISOString() ?? null,
      verificationSourceName: entity.verificationSourceName,
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
      helperPhone: viewer === 'project' ? entity.helper.contactPhone : '',
      helperVerificationLevel: entity.helper.verificationLevel,
      helperVerifiedSkills: entity.helper.verifiedSkills,
      helperVerificationSource: entity.helper.verificationSourceName,
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

  private isCommerce(kind: RecoveryProjectKind): boolean {
    return [
      RecoveryProjectKind.BUSINESS,
      RecoveryProjectKind.RESTAURANT,
      RecoveryProjectKind.ARTISAN,
    ].includes(kind);
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
