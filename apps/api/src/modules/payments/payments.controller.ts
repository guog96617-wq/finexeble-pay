import { Body, Controller, Get, Headers, Param, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("v1/payments/create")
  createPayment(
    @Body() body: { merchantOrderNo: string; amount: string; currency: string; customerEmail?: string },
    @Headers() headers: Record<string, string>,
    @Req() request: Request,
  ) {
    return this.payments.createPayment(body, headers, request.ip);
  }

  @Get("v1/orders/:orderNo")
  getOrder(@Param("orderNo") orderNo: string) {
    return this.payments.getOrderByNo(orderNo);
  }

  @Post("v1/refunds/create")
  createRefund(@Body() body: { orderNo: string; amount: string; reason?: string }) {
    return this.payments.createRefund(body);
  }

  @Post("webhooks/payment/notify")
  pspNotify(@Body() body: { orderNo: string; status: "PAID" | "FAILED"; providerReference?: string }) {
    return this.payments.handlePspNotify(body);
  }
}
