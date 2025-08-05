import { PartialType } from '@nestjs/swagger';
import { CreateServiceMenuDto } from './create-service-menu.dto';

export class UpdateServiceMenuDto extends PartialType(CreateServiceMenuDto) {}
