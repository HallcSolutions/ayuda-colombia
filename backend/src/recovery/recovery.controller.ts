import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { MAX_RECOVERY_PHOTOS } from '../common/constants/app.constants';
import {
  PublishedRecoveryProject,
  RecoveryAccessRequest,
  RecoveryApplication,
  RecoveryHelperProfile,
  RecoveryProject,
  RecoveryTask,
  RecoveryVerificationQueue,
  RegisteredRecoveryHelper,
} from '../common/interfaces/recovery.interface';
import { photoUploadOptions } from '../common/uploads/photo-upload';
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
import { RecoveryService } from './recovery.service';
import { RecoveryVerifierGuard } from './recovery-verifier.guard';

@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recovery: RecoveryService) {}

  @Get('projects')
  findProjects(
    @Query() filters: FindRecoveryProjectsQueryDto,
  ): Promise<RecoveryProject[]> {
    return this.recovery.findProjects(filters);
  }

  @Get('projects/:id')
  findProject(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<RecoveryProject> {
    return this.recovery.findProject(id);
  }

  @Post('projects')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor('photos', MAX_RECOVERY_PHOTOS, photoUploadOptions),
  )
  createProject(
    @Body() dto: CreateRecoveryProjectDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<PublishedRecoveryProject> {
    return this.recovery.createProject(dto, files);
  }

  @Patch('projects/:id')
  updateProject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecoveryProjectDto,
    @Headers('x-recovery-pin') pin = '',
  ): Promise<RecoveryProject> {
    return this.recovery.updateProject(id, dto, pin);
  }

  @Post('projects/:id/tasks')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  createTask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateRecoveryTaskDto,
    @Headers('x-recovery-pin') pin = '',
  ): Promise<RecoveryTask> {
    return this.recovery.createTask(id, dto, pin);
  }

  @Patch('projects/:projectId/tasks/:taskId')
  updateTask(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() dto: UpdateRecoveryTaskDto,
    @Headers('x-recovery-pin') pin = '',
  ): Promise<RecoveryTask> {
    return this.recovery.updateTask(projectId, taskId, dto, pin);
  }

  @Get('projects/:id/applications')
  projectApplications(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-recovery-pin') pin = '',
  ): Promise<RecoveryApplication[]> {
    return this.recovery.getProjectApplications(id, pin);
  }

  @Patch('projects/:projectId/applications/:applicationId')
  updateApplication(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Body() dto: UpdateRecoveryApplicationDto,
    @Headers('x-recovery-pin') pin = '',
  ): Promise<RecoveryApplication> {
    return this.recovery.updateApplication(projectId, applicationId, dto, pin);
  }

  /**
   * Devuelve el acceso por correo a quien perdió su código o su PIN. Responde igual
   * exista o no la dirección, para no delatar quién está registrado.
   */
  @Post('access/recover')
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  recoverAccess(
    @Body() dto: RecoverRecoveryAccessDto,
  ): Promise<RecoveryAccessRequest> {
    return this.recovery.recoverAccess(dto);
  }

  @Post('helpers')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  registerHelper(
    @Body() dto: RegisterRecoveryHelperDto,
  ): Promise<RegisteredRecoveryHelper> {
    return this.recovery.registerHelper(dto);
  }

  @Get('helpers/:id')
  getHelper(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-helper-pin') pin = '',
  ): Promise<RecoveryHelperProfile> {
    return this.recovery.getHelper(id, pin);
  }

  @Get('helpers/:id/applications')
  helperApplications(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-helper-pin') pin = '',
  ): Promise<RecoveryApplication[]> {
    return this.recovery.getHelperApplications(id, pin);
  }

  @Post('tasks/:id/applications')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  applyToTask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateRecoveryApplicationDto,
    @Headers('x-helper-pin') pin = '',
  ): Promise<RecoveryApplication> {
    return this.recovery.applyToTask(id, dto, pin);
  }

  @Patch('applications/:id/withdraw')
  withdrawApplication(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-helper-pin') pin = '',
  ): Promise<RecoveryApplication> {
    return this.recovery.withdrawApplication(id, pin);
  }

  @Get('verification/queue')
  @UseGuards(RecoveryVerifierGuard)
  verificationQueue(): Promise<RecoveryVerificationQueue> {
    return this.recovery.verificationQueue();
  }

  @Patch('verification/projects/:id')
  @UseGuards(RecoveryVerifierGuard)
  reviewProject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReviewRecoveryProjectDto,
  ): Promise<RecoveryProject> {
    return this.recovery.reviewProject(id, dto);
  }

  @Patch('verification/tasks/:id')
  @UseGuards(RecoveryVerifierGuard)
  reviewTask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReviewRecoveryTaskDto,
  ): Promise<RecoveryTask> {
    return this.recovery.reviewTask(id, dto);
  }
}
