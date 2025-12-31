import cron from "node-cron";
import { EscrowService } from "../modules/escrow/escrow.service";

cron.schedule("0 1 * * *", async () => {
  try {
    const results = await EscrowService.autoReleaseReadyEscrows();

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[CRON] Escrow auto-release completed. 
       Processed=${results.length}, 
       Success=${successCount}, 
       Failed=${failureCount}`
    );

    if (failureCount > 0) {
      console.error(
        "[CRON] Escrow auto-release failures:",
        results.filter((r) => !r.success)
      );
    }
  } catch (error: any) {
    console.error("[CRON] Escrow auto-release error:", error);
  }
});
