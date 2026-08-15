import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  RecoveryApplicationStatus,
  RecoveryProjectKind,
  RecoveryProjectStatus,
  RecoveryRiskLevel,
  RecoveryTaskCategory,
  RecoveryTaskStatus,
} from '../common/constants/app.constants';
import { createEditPin, matchesEditPin } from '../common/security/edit-pin';
import { PhotoStorageService } from '../common/uploads/photo-upload';
import { RecoveryApplicationEntity } from './infrastructure/entities/recovery-application.entity';
import { RecoveryHelperEntity } from './infrastructure/entities/recovery-helper.entity';
import { RecoveryProjectEntity } from './infrastructure/entities/recovery-project.entity';
import { RecoveryTaskEntity } from './infrastructure/entities/recovery-task.entity';
import { RecoveryAccessMailer } from './recovery-access.mailer';
import { RecoveryGateway } from './recovery.gateway';
import { RecoveryService } from './recovery.service';

const projectPin = createEditPin();
const helperPin = createEditPin();
const now = new Date('2026-08-15T12:00:00Z');

const projectEntity = (
  overrides: Partial<RecoveryProjectEntity> = {},
): RecoveryProjectEntity => ({
  id: '11111111-1111-4111-8111-111111111111',
  kind: RecoveryProjectKind.RESTAURANT,
  name: 'Cocina La Montaña',
  story:
    'El terremoto dañó la cocina y seguimos vendiendo almuerzos en la calle.',
  organizerName: 'Ana Pérez',
  contactPhone: '3001234567',
  contactEmail: 'ana@example.com',
  department: 'Caldas',
  municipality: 'Manizales',
  areaReference: 'Barrio El Bosque',
  productsOrServices: 'Almuerzos y arepas',
  priceReference: 'Desde $8.000',
  salesModes: [],
  schedule: '8 a. m. a 3 p. m.',
  photos: [],
  shareContactPublicly: true,
  status: RecoveryProjectStatus.PENDING_REVIEW,
  verifiedBy: '',
  verifiedAt: null,
  editPinHash: projectPin.hash,
  tasks: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const taskEntity = (
  overrides: Partial<RecoveryTaskEntity> = {},
): RecoveryTaskEntity => ({
  id: '22222222-2222-4222-8222-222222222222',
  projectId: projectEntity().id,
  project: projectEntity({
    status: RecoveryProjectStatus.OPEN,
    verifiedAt: now,
    verifiedBy: 'Coordinación local',
  }),
  title: 'Revisar instalación eléctrica',
  description: 'La pared se agrietó junto al tablero.',
  category: RecoveryTaskCategory.ELECTRICAL,
  riskLevel: RecoveryRiskLevel.RED,
  status: RecoveryTaskStatus.OPEN,
  peopleNeeded: 1,
  scheduledFor: null,
  durationHours: null,
  skillsRequired: 'Electricista acreditado',
  materialsNeeded: '',
  professionalRequired: true,
  reviewedBy: 'Coordinación local',
  reviewedAt: now,
  applications: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const helperEntity = (
  overrides: Partial<RecoveryHelperEntity> = {},
): RecoveryHelperEntity => ({
  id: '33333333-3333-4333-8333-333333333333',
  displayName: 'Carlos G.',
  contactPhone: '3101234567',
  contactEmail: 'carlos@example.com',
  department: 'Caldas',
  municipality: 'Manizales',
  skills: [RecoveryTaskCategory.ELECTRICAL],
  editPinHash: helperPin.hash,
  applications: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('RecoveryService', () => {
  let service: RecoveryService;
  let projects: jest.Mocked<Repository<RecoveryProjectEntity>>;
  let tasks: jest.Mocked<Repository<RecoveryTaskEntity>>;
  let helpers: jest.Mocked<Repository<RecoveryHelperEntity>>;
  let applications: jest.Mocked<Repository<RecoveryApplicationEntity>>;
  let photoStorage: jest.Mocked<PhotoStorageService>;
  let mailer: jest.Mocked<RecoveryAccessMailer>;

  beforeEach(() => {
    projects = {
      create: jest.fn((values) =>
        projectEntity(values as Partial<RecoveryProjectEntity>),
      ),
      save: jest.fn((entity: RecoveryProjectEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
      findBy: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<Repository<RecoveryProjectEntity>>;
    tasks = {
      create: jest.fn((values) =>
        taskEntity(values as Partial<RecoveryTaskEntity>),
      ),
      save: jest.fn((entity: RecoveryTaskEntity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<RecoveryTaskEntity>>;
    helpers = {
      create: jest.fn((values) =>
        helperEntity(values as Partial<RecoveryHelperEntity>),
      ),
      save: jest.fn((entity: RecoveryHelperEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
      findBy: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<Repository<RecoveryHelperEntity>>;
    applications = {
      existsBy: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<RecoveryApplicationEntity>>;
    photoStorage = {
      store: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    mailer = {
      available: true,
      sendAccess: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<RecoveryAccessMailer>;
    service = new RecoveryService(
      projects,
      tasks,
      helpers,
      applications,
      {
        projectCreated: jest.fn(),
        projectUpdated: jest.fn(),
      } as unknown as RecoveryGateway,
      photoStorage,
      mailer,
    );
  });

  it('publica el caso de inmediato y muestra el teléfono solo cuando se autoriza para pedidos', async () => {
    const created = await service.createProject({
      kind: RecoveryProjectKind.RESTAURANT,
      name: 'Cocina La Montaña',
      story: 'El terremoto destruyó parte de la cocina.',
      organizerName: 'Ana Pérez',
      contactPhone: '3001234567',
      department: 'Caldas',
      municipality: 'Manizales',
      areaReference: 'Barrio El Bosque',
      productsOrServices: 'Almuerzos',
      shareContactPublicly: true,
      consentToVerification: true,
    });

    expect(created.status).toBe(RecoveryProjectStatus.OPEN);
    expect(created.publicContactPhone).toBe('3001234567');
    expect(created.pendingTaskCount).toBe(0);
    expect(created.editPin).toHaveLength(6);
  });

  it('mantiene privado el teléfono cuando no se autoriza su publicación', async () => {
    const created = await service.createProject({
      kind: RecoveryProjectKind.HOME,
      name: 'Vivienda familia Pérez',
      story: 'El terremoto afectó el techo de la vivienda.',
      organizerName: 'Ana Pérez',
      contactPhone: '3001234567',
      department: 'Caldas',
      municipality: 'Manizales',
      areaReference: 'Barrio El Bosque',
      shareContactPublicly: false,
      consentToVerification: true,
    });

    expect(created.status).toBe(RecoveryProjectStatus.OPEN);
    expect(created.publicContactPhone).toBe('');
  });

  it('publica el caso de una persona con la foto y con el contacto directo que autorizó', async () => {
    photoStorage.store.mockResolvedValue(['/uploads/silla.jpg']);

    const created = await service.createProject(
      {
        kind: RecoveryProjectKind.PERSON,
        name: 'Doña Rosa',
        story: 'Perdió la silla de ruedas cuando se cayó el techo.',
        organizerName: 'Ana Pérez',
        contactPhone: '3001234567',
        department: 'Caldas',
        municipality: 'Manizales',
        areaReference: 'Barrio El Bosque',
        shareContactPublicly: true,
        consentToVerification: true,
      },
      [{ originalname: 'silla.jpg' } as Express.Multer.File],
    );

    expect(created.photos).toEqual(['/uploads/silla.jpg']);
    expect(created.publicContactPhone).toBe('3001234567');
  });

  it('no publica el teléfono de una persona que no lo autorizó', async () => {
    const created = await service.createProject({
      kind: RecoveryProjectKind.PERSON,
      name: 'Doña Rosa',
      story: 'Perdió la silla de ruedas cuando se cayó el techo.',
      organizerName: 'Ana Pérez',
      contactPhone: '3001234567',
      department: 'Caldas',
      municipality: 'Manizales',
      areaReference: 'Barrio El Bosque',
      shareContactPublicly: false,
      consentToVerification: true,
    });

    expect(created.publicContactPhone).toBe('');
  });

  it('borra las fotos recién subidas si el caso no se pudo guardar', async () => {
    photoStorage.store.mockResolvedValue(['/uploads/silla.jpg']);
    projects.save.mockRejectedValueOnce(new Error('sin base de datos'));

    await expect(
      service.createProject(
        {
          kind: RecoveryProjectKind.PERSON,
          name: 'Doña Rosa',
          story: 'Perdió la silla de ruedas cuando se cayó el techo.',
          organizerName: 'Ana Pérez',
          contactPhone: '3001234567',
          department: 'Caldas',
          municipality: 'Manizales',
          areaReference: 'Barrio El Bosque',
          consentToVerification: true,
        },
        [{ originalname: 'silla.jpg' } as Express.Multer.File],
      ),
    ).rejects.toThrow('sin base de datos');
    expect(photoStorage.remove.mock.calls).toEqual([[['/uploads/silla.jpg']]]);
  });

  it('deja una donación de silla de ruedas en riesgo bajo y sin exigir profesional', async () => {
    projects.findOneBy.mockResolvedValue(projectEntity());

    const task = await service.createTask(
      projectEntity().id,
      {
        title: 'Silla de ruedas plegable',
        description: 'Talla adulto, para salir del albergue a la calle.',
        category: RecoveryTaskCategory.ASSISTIVE_DEVICE,
        peopleNeeded: 1,
      },
      projectPin.pin,
    );

    expect(task.riskLevel).toBe(RecoveryRiskLevel.GREEN);
    expect(task.professionalRequired).toBe(false);
    // Entregar una silla de ruedas no tiene riesgo que clasificar: se ve ya.
    expect(task.status).toBe(RecoveryTaskStatus.OPEN);
  });

  it('clasifica electricidad como riesgo rojo desde su creación', async () => {
    projects.findOneBy.mockResolvedValue(projectEntity());

    const task = await service.createTask(
      projectEntity().id,
      {
        title: 'Revisar instalación',
        description: 'Hay cables junto a una grieta.',
        category: RecoveryTaskCategory.ELECTRICAL,
        peopleNeeded: 1,
      },
      projectPin.pin,
    );

    expect(task.riskLevel).toBe(RecoveryRiskLevel.RED);
    expect(task.professionalRequired).toBe(true);
    expect(task.status).toBe(RecoveryTaskStatus.PENDING_REVIEW);
  });

  it('impide que el revisor rebaje una tarea eléctrica a riesgo medio', async () => {
    tasks.findOne.mockResolvedValue(
      taskEntity({ status: RecoveryTaskStatus.PENDING_REVIEW }),
    );

    await expect(
      service.reviewTask(taskEntity().id, {
        riskLevel: RecoveryRiskLevel.AMBER,
        status: RecoveryTaskStatus.OPEN,
        reviewedBy: 'Coordinación local',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no expone el contacto de quien se ofrece al registrarlo', async () => {
    const helper = await service.registerHelper({
      displayName: 'Carlos G.',
      contactPhone: '3101234567',
      department: 'Caldas',
      municipality: 'Manizales',
      skills: [RecoveryTaskCategory.ELECTRICAL],
      consentToShareContact: true,
    });

    expect(helper).not.toHaveProperty('contactPhone');
    expect(helper).not.toHaveProperty('contactEmail');
    expect(helper.skills).toEqual([RecoveryTaskCategory.ELECTRICAL]);
  });

  it('exige autorizar que el contacto se entregue a quien pide ayuda', async () => {
    await expect(
      service.registerHelper({
        displayName: 'Carlos G.',
        contactPhone: '3101234567',
        department: 'Caldas',
        municipality: 'Manizales',
        skills: [RecoveryTaskCategory.ELECTRICAL],
        consentToShareContact: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('acepta la postulación sin ninguna comprobación previa del perfil', async () => {
    tasks.findOne.mockResolvedValue(taskEntity());
    helpers.findOneBy.mockResolvedValue(helperEntity());
    applications.existsBy.mockResolvedValue(false);
    applications.create.mockImplementation(
      (values) => values as RecoveryApplicationEntity,
    );
    applications.save.mockImplementation((entity) =>
      Promise.resolve({
        ...entity,
        createdAt: now,
        updatedAt: now,
      } as RecoveryApplicationEntity),
    );

    const application = await service.applyToTask(
      taskEntity().id,
      { helperId: helperEntity().id, message: '', availability: 'Mañana' },
      helperPin.pin,
    );

    expect(application.status).toBe(RecoveryApplicationStatus.PENDING);
  });

  it('rechaza postularse a una ayuda que la persona no ofreció', async () => {
    tasks.findOne.mockResolvedValue(taskEntity());
    helpers.findOneBy.mockResolvedValue(
      helperEntity({ skills: [RecoveryTaskCategory.FOOD] }),
    );

    await expect(
      service.applyToTask(
        taskEntity().id,
        { helperId: helperEntity().id, message: '', availability: 'Mañana' },
        helperPin.pin,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revela el teléfono del voluntario al proyecto solo después de aceptar', async () => {
    projects.findOneBy.mockResolvedValue(projectEntity());
    const application = {
      id: '44444444-4444-4444-8444-444444444444',
      taskId: taskEntity().id,
      task: taskEntity(),
      helperId: helperEntity().id,
      helper: helperEntity(),
      message: 'Puedo ayudar',
      availability: 'Mañana',
      status: RecoveryApplicationStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    } as RecoveryApplicationEntity;
    const query = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([application]),
    };
    applications.createQueryBuilder.mockReturnValue(query as never);

    const pending = await service.getProjectApplications(
      projectEntity().id,
      projectPin.pin,
    );
    expect(pending[0].helperPhone).toBe('');
    expect(pending[0].helperSkills).toEqual([RecoveryTaskCategory.ELECTRICAL]);

    application.status = RecoveryApplicationStatus.ACCEPTED;
    const accepted = await service.getProjectApplications(
      projectEntity().id,
      projectPin.pin,
    );
    expect(accepted[0].helperPhone).toBe('3101234567');
  });

  it('recupera el acceso con un PIN nuevo y deja sin valor el anterior', async () => {
    const project = projectEntity({ contactEmail: 'ana@example.com' });
    projects.findBy.mockResolvedValue([project]);

    const response = await service.recoverAccess({
      email: ' Ana@Example.com ',
    });

    expect(response).toEqual({ requested: true });
    expect(projects.findBy.mock.calls[0][0]).toEqual({
      contactEmail: 'ana@example.com',
    });
    expect(project.editPinHash).not.toBe(projectPin.hash);
    expect(projects.save.mock.calls[0][0]).toEqual([project]);
    const [to, entries, reason] = mailer.sendAccess.mock.calls[0];
    expect(to).toBe('ana@example.com');
    expect(reason).toBe('recovered');
    expect(entries).toHaveLength(1);
    expect(entries[0].code).toBe(project.id);
    expect(matchesEditPin(entries[0].pin, project.editPinHash)).toBe(true);
    expect(matchesEditPin(projectPin.pin, project.editPinHash)).toBe(false);
  });

  it('conserva el PIN anterior si el correo no pudo enviarse', async () => {
    const project = projectEntity({ contactEmail: 'ana@example.com' });
    projects.findBy.mockResolvedValue([project]);
    mailer.sendAccess.mockResolvedValue(false);

    const response = await service.recoverAccess({ email: 'ana@example.com' });

    expect(response).toEqual({ requested: true });
    expect(projects.save.mock.calls).toHaveLength(0);
    expect(matchesEditPin(projectPin.pin, projectEntity().editPinHash)).toBe(
      true,
    );
  });

  it('responde igual cuando el correo no está registrado y no envía nada', async () => {
    const response = await service.recoverAccess({
      email: 'desconocido@example.com',
    });

    expect(response).toEqual({ requested: true });
    expect(mailer.sendAccess.mock.calls).toHaveLength(0);
    expect(projects.save.mock.calls).toHaveLength(0);
    expect(helpers.save.mock.calls).toHaveLength(0);
  });

  it('avisa que la recuperación no está disponible si no hay correo configurado', async () => {
    Object.defineProperty(mailer, 'available', { value: false });

    await expect(
      service.recoverAccess({ email: 'ana@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(projects.findBy.mock.calls).toHaveLength(0);
  });
});
