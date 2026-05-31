import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post("logout")
  logout() {
    return { loggedOut: true };
  }

  @Post("mfa/verify")
  verifyMfa(@Body() body: { code: string }) {
    return { verified: body.code.length === 6 };
  }

  @Get("me")
  me() {
    return {
      email: "admin@payhub.local",
      role: "SUPER_ADMIN",
      permissions: ["admin", "merchant", "agent", "payments", "wallets"],
    };
  }
}
