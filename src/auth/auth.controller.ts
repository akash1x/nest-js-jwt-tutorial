import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { GetCurrenUser, GetCurrenUserId } from 'src/common/decorators';
import { AtGuard, RtGuard } from 'src/common/guards';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService){}

    @Post('local/signup') 
    @HttpCode(HttpStatus.CREATED)
    signUpLocal(@Body() dto:AuthDto): Promise<Tokens> {
       return this.authService.signUpLocal(dto);
    }

    @Post('local/signin')
    @HttpCode(HttpStatus.OK)
    signInLocal(@Body() dto:AuthDto): Promise<Tokens>{
      return this.authService.signInLocal(dto)
    }

    @UseGuards(AtGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@GetCurrenUserId() userId:number ){
        return this.authService.logout(userId)
    }

    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(@GetCurrenUserId() userId:number, @GetCurrenUser('refreshToken') refreshToken: string ){
        return this.authService.refreshTokens(userId,refreshToken)
    }
}
