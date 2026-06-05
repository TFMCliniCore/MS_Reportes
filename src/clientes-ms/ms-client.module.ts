import { Global, Module } from '@nestjs/common';
import { MsClientService } from './ms-client.service';

@Global()
@Module({
  providers: [MsClientService],
  exports: [MsClientService],
})
export class MsClientModule {}
