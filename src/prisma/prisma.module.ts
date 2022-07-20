import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes the module Global can be accessed in every module no need to mention in imports
@Module({
  providers: [PrismaService],
  exports: [PrismaService] // Exporting it globally
})
export class PrismaModule {}
