/**
 * @file escrowRelease.cron.ts
 * Cron job for auto-releasing escrows
 */

import cron from "node-cron";
import { EscrowService } from "../modules/escrow/escrow.service";


cron.schedule("0 1 * * *", async () => {
  try {
    const results = await EscrowService.autoReleaseReadyEscrows();
    
    console.log(`Escrow auto-release completed. Processed: ${results.length}`);
    
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    if (failureCount > 0) {
      console.error(
        `Escrow auto-release failures: ${failureCount}`,
        results.filter((r) => !r.success)
      );
    }
  } catch (error: any) {
    console.error("Escrow auto-release cron error:", error);
  }
});

