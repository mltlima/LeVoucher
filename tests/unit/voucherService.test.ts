import supertest from "supertest";

import prisma from "../../src/config/database.js";
import app from "../../src/app.js";

const agent = supertest(app);

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE vouchers`;
});

describe("voucherService test suite", () => {
  it("should be always very positive", () => {
    expect("didi").toBe("didi");
  })
})

//body for tests
const bodyUse ={
  code: "ABC123",
  amount: 100
}
const bodyCreate ={
  code: "ABC123",
  discount: 10
}

//----------------------------------------------------------------------------------------------------------------------

describe("POST /vouchers", () => {
  it("should create a voucher", async () => {
    //await prisma.voucher.create({data: body});
    const response = await agent
      .post("/vouchers")
      .send(bodyCreate);

    expect(response.status).toEqual(201);
  });

  it("voucher without body should return 422", async () => {
    const response = await agent
      .post("/vouchers")
      .send({});

    expect(response.status).toEqual(422);
  });

  it("duplicate voucher code should return 409", async () => {
    await prisma.voucher.create({data: bodyCreate});
    const response = await agent
      .post("/vouchers")
      .send(bodyCreate);

    expect(response.status).toEqual(409);
  });
})

//----------------------------------------------------------------------------------------------------------------------

describe("POST /vouchers/apply", () => {
  it("should apply a voucher", async () => {
    await prisma.voucher.create({data: bodyCreate});
    const response = await agent
      .post("/vouchers/apply")
      .send(bodyUse);

    expect(response.status).toEqual(200);
  });

  it("invalid voucher code should return 409", async () => {
    const response = await agent
      .post("/vouchers/apply")
      .send({code: "aaa", amount: 100});

    expect(response.status).toEqual(409);
  });

  it("voucher should be used only once", async () => {
    await prisma.voucher.create({data: bodyCreate});
    await agent
      .post("/vouchers/apply")
      .send(bodyUse);
    const response = await agent
      .post("/vouchers/apply")
      .send(bodyUse);

    expect(response.status).toEqual(200);
  });
  
  it("minimum use value should be 100", async () => {
    await prisma.voucher.create({data: bodyCreate});
    const response = await agent
      .post("/vouchers/apply")
      .send({...bodyUse, amount: 99});

    expect(response.status).toEqual(200);
  });

  it("program should return total value and discount", async () => {
    await prisma.voucher.create({data: bodyCreate});
    const response = await agent
      .post("/vouchers/apply")
      .send(bodyUse);

    console.log(response.body);
    expect(response.body.amount).toEqual(100);
    expect(response.body.discount).toEqual(10);
    expect(response.body.finalAmount).toEqual(90);
    expect(response.body.applied).toEqual(true);
  });
})

afterAll(async () => {
  await prisma.$disconnect();
});