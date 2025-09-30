// Nest js
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import {Cache} from 'cache-manager';
import {Inject} from '@nestjs/common';
import {Observable, of, tap} from 'rxjs';


import {RedisCacheService} from '../redis-cache.service';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
    constructor(
        private redisCacheService: RedisCacheService,
        @Inject('CACHE_MANAGER') private cacheManager: Cache,
    ) {
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();
        if (req.method !== 'GET') return next.handle();

        const userId = req.user.id;
        const encodedUrl = encodeURIComponent(req.originalUrl);
        const key = `cache:module:user_${userId}_${encodedUrl}`;


        const cached = await this.redisCacheService.get(key);

        if (cached) {
            return of(cached);
        }

        return next.handle().pipe(
            tap(async (data) => {
                const chat = data?.chat ?? data;
                const serialized = chat?.toJSON?.() ?? chat;

                await this.redisCacheService.set(key, serialized, 300);
            }),
        );
    }
}


