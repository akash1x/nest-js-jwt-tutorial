import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from "bcrypt"
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService,
        private jwtService:JwtService){}

    async signUpLocal(dto: AuthDto) : Promise<Tokens>{
        const hash = await this.hashData(dto.password);
        const newUser= await this.prisma.user.create({
            data:{
                email:dto.email,
                hash:hash,
            }
        })
       const tokens = await this.generateTokens(newUser.id,newUser.email)
       await this.updateRtHash(newUser.id,tokens.refresh_token)
       return tokens;
    }

    async signInLocal(dto: AuthDto) : Promise<Tokens>{
        const user = await this.prisma.user.findUnique({
            where:{
                email:dto.email
            }
        })

        if(!user) throw new ForbiddenException("Access Denied")

        const passwordMatches = await bcrypt.compare(dto.password,user.hash)
        if(!passwordMatches) throw new ForbiddenException("Access Denied")
        
        const tokens = await this.generateTokens(user.id,user.email)
        await this.updateRtHash(user.id,tokens.refresh_token)
        return tokens;

    }

    async refreshTokens(userId: number, rt:string){
        const user = await this.prisma.user.findUnique({
            where:{
                id:userId
            }
        })
        if(!user || !user.hashedRt) throw new ForbiddenException("Access Denied")

        const rtMatches = await bcrypt.compare(rt,user.hashedRt);
        
        if(!rtMatches) throw new ForbiddenException("Access Denied")

        const tokens = await this.generateTokens(user.id,user.email)
        await this.updateRtHash(user.id,tokens.refresh_token)
        return tokens;
    }

    async logout(userId: number){
        await this.prisma.user.updateMany({
            where:{
                id:userId,
                hashedRt:{
                    not:null
                },
            } ,data:{
                hashedRt:null
            }
        })
    }


    //Utility Functions
    hashData(data:string): Promise<string>{
        return bcrypt.hash(data,10)
    }

    async updateRtHash(userId:number,rt:string){
        const hash = await this.hashData(rt);
        await this.prisma.user.update({
            where:{
                id:userId
            },
            data:{
                hashedRt:hash
            }
        })
    }

    async generateTokens(userId: number,email:string){
        const [at,rt] = await Promise.all([
            this.jwtService.signAsync({
            sub:userId,
            email, 
         },{
             expiresIn:60*15,
             secret:"at-secret"
         }),
         this.jwtService.signAsync({
            sub:userId,
            email, 
         },{
             expiresIn:60*60*24*7,
             secret: "rt-secret"
         })]
         
        )
      return {
          access_token:at,
          refresh_token:rt
      }  
    }
}
