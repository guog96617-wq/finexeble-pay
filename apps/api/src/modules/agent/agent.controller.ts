import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AgentService } from "./agent.service";

@ApiTags("agent")
@Controller("agent")
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Get("dashboard")
  dashboard() {
    return this.agent.dashboard();
  }

  @Get("merchants")
  merchants() {
    return this.agent.merchants();
  }

  @Get("orders")
  orders() {
    return this.agent.orders();
  }

  @Get("commissions")
  commissions() {
    return this.agent.commissions();
  }
}
