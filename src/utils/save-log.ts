import { ProviderLog } from '@app/models/provider-log';
import { AppDataSource } from '@app/app';

export async function saveLog(vrm: string, provider: string, startTime: Date, responseCode: number, errorCode?: string, errorMessage?: string) {
  const log = new ProviderLog();
  log.vrm = vrm;
  log.requestDate = startTime;
  log.requestDuration = Date.now() - startTime.getTime();
  log.requestUrl = `valuations/${vrm}`;
  log.responseCode = responseCode;
  log.errorCode = errorCode;
  log.errorMessage = errorMessage;
  log.provider = provider;
  await AppDataSource.getRepository(ProviderLog).save(log);
}
