import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type EventPayload = {
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
};

export async function trackEvent(payload: EventPayload) {
  console.log(JSON.stringify({ level: "info", type: "metric_event", ...payload, timestamp: new Date().toISOString() }));
  await prisma.metricEvent.create({
    data: {
      eventName: payload.eventName,
      userId: payload.userId,
      properties: (payload.properties ?? {}) as Prisma.InputJsonValue
    }
  });
}
