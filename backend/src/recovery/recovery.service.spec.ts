import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
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
import { createEditPin } from '../common/security/edit-pin';
import { RecoveryApplicationEntity } from './infrastructure/entities/recovery-application.entity';
import { RecoveryHelperEntity } from './infrastructure/entities/recovery-helper.entity';
import { RecoveryProjectEntity } from './infrastructure/entities/recovery-project.entity';
import { RecoveryTaskEntity } from './infrastructure/entities/recovery-task.entity';
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
  department: 'Caldas',
  municipality: 'Manizales',
  areaReference: 'Barrio El Bosque',
  productsOrServices: 'Almuerzos y arepas',
  priceReference: 'Desde $8.000',
  salesModes: [],
  schedule: '8 a. m. a 3 p. m.',
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
  fullName: 'Carlos Gómez',
  displayName: 'Carlos G.',
  documentType: 'CC',
  documentNumber: '123456789',
  contactPhone: '3101234567',
  department: 'Caldas',
  municipality: 'Manizales',
  skills: [RecoveryTaskCategory.ELECTRICAL],
  verifiedSkills: [],
  bio: 'Instalaciones residenciales',
  yearsExperience: 8,
  credentialType: HelperCredentialType.NONE,
  credentialNumber: '',
  credentialIssuer: '',
  referenceName: '',
  referencePhone: '',
  verificationLevel: HelperVerificationLevel.PENDING,
  verificationMethod: null,
  verifiedBy: '',
  verifiedAt: null,
  verificationNotes: '',
  verificationSourceName: '',
  verificationSourceUrl: '',
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

  beforeEach(() => {
    process.env.RECOVERY_TRUSTED_REGISTRY_DOMAINS = 'registro.gov.co';
    projects = {
      create: jest.fn((values) =>
        projectEntity(values as Partial<RecoveryProjectEntity>),
      ),
      save: jest.fn((entity: RecoveryProjectEntity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
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
    } as unknown as jest.Mocked<Repository<RecoveryHelperEntity>>;
    applications = {
      existsBy: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<RecoveryApplicationEntity>>;
    service = new RecoveryService(projects, tasks, helpers, applications, {
      projectCreated: jest.fn(),
      projectUpdated: jest.fn(),
    } as unknown as RecoveryGateway);
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

  it('no expone documento, teléfono ni credencial al registrar un ayudante', async () => {
    const helper = await service.registerHelper({
      fullName: 'Carlos Gómez',
      displayName: 'Carlos G.',
      documentType: 'CC',
      documentNumber: '123456789',
      contactPhone: '3101234567',
      department: 'Caldas',
      municipality: 'Manizales',
      skills: [RecoveryTaskCategory.ELECTRICAL],
      yearsExperience: 8,
      credentialType: HelperCredentialType.NONE,
      consentToVerification: true,
    });

    expect(helper).not.toHaveProperty('documentNumber');
    expect(helper).not.toHaveProperty('contactPhone');
    expect(helper).not.toHaveProperty('credentialNumber');
    expect(helper.verificationLevel).toBe(HelperVerificationLevel.PENDING);
  });

  it('solo permite nivel profesional con matrícula y consulta oficial', async () => {
    helpers.findOneBy.mockResolvedValue(helperEntity());

    await expect(
      service.reviewHelper(helperEntity().id, {
        verificationLevel: HelperVerificationLevel.PROFESSIONAL,
        verificationMethod: HelperVerificationMethod.OFFICIAL_REGISTRY,
        verifiedSkills: [RecoveryTaskCategory.ELECTRICAL],
        verifiedBy: 'Coordinación local',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registra una validación profesional trazable solo desde un dominio autorizado', async () => {
    helpers.findOneBy.mockResolvedValue(
      helperEntity({
        credentialType: HelperCredentialType.PROFESSIONAL_LICENSE,
        credentialNumber: 'MAT-2048',
        credentialIssuer: 'Consejo profesional',
      }),
    );

    const reviewed = await service.reviewHelper(helperEntity().id, {
      verificationLevel: HelperVerificationLevel.PROFESSIONAL,
      verificationMethod: HelperVerificationMethod.OFFICIAL_REGISTRY,
      verifiedSkills: [RecoveryTaskCategory.ELECTRICAL],
      verifiedBy: 'Coordinación local',
      verificationSourceName: 'Registro oficial de prueba',
      verificationSourceUrl: 'https://consulta.registro.gov.co/matriculas',
    });

    expect(reviewed.verificationLevel).toBe(
      HelperVerificationLevel.PROFESSIONAL,
    );
    expect(reviewed.verificationSourceName).toBe('Registro oficial de prueba');
  });

  it('rechaza una supuesta fuente profesional fuera de la lista autorizada', async () => {
    helpers.findOneBy.mockResolvedValue(
      helperEntity({
        credentialType: HelperCredentialType.PROFESSIONAL_LICENSE,
        credentialNumber: 'MAT-2048',
        credentialIssuer: 'Consejo profesional',
      }),
    );

    await expect(
      service.reviewHelper(helperEntity().id, {
        verificationLevel: HelperVerificationLevel.PROFESSIONAL,
        verificationMethod: HelperVerificationMethod.OFFICIAL_REGISTRY,
        verifiedSkills: [RecoveryTaskCategory.ELECTRICAL],
        verifiedBy: 'Coordinación local',
        verificationSourceName: 'Página no oficial',
        verificationSourceUrl: 'https://ejemplo.com/certificado',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza postulaciones de perfiles todavía pendientes', async () => {
    tasks.findOne.mockResolvedValue(taskEntity());
    helpers.findOneBy.mockResolvedValue(helperEntity());

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
      helper: helperEntity({
        verificationLevel: HelperVerificationLevel.IDENTITY,
      }),
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

    application.status = RecoveryApplicationStatus.ACCEPTED;
    const accepted = await service.getProjectApplications(
      projectEntity().id,
      projectPin.pin,
    );
    expect(accepted[0].helperPhone).toBe('3101234567');
  });
});
