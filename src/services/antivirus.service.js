import net from "net";

/**
 * Scan a file buffer for malware using the ClamAV daemon (clamd) over TCP instream protocol.
 * If the ClamAV daemon is not configured or running, it logs a warning and falls back to clean status.
 * It also performs a quick local signature check for the EICAR standard test string.
 *
 * @param {Buffer} buffer File buffer to scan
 * @param {string} filename Name of the file being scanned
 * @returns {Promise<boolean>} Resolves to true if clean, rejects with Error if malware detected
 */
export async function scanFileForMalware(buffer, filename) {
  return new Promise((resolve, reject) => {
    const port = parseInt(process.env.CLAMAV_PORT || "3310", 10);
    const host = process.env.CLAMAV_HOST || "127.0.0.1";

    console.log(`[ANTIVIRUS] Initiating clamd scan for ${filename}...`);

    // 1. Local EICAR test file heuristic
    const bufferStr = buffer.toString("utf8");
    if (
      bufferStr.includes("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*") ||
      filename.toLowerCase().includes("eicar")
    ) {
      console.warn(`[SECURITY MONITORING] Malware signature detected in upload: EICAR Test File in ${filename}`);
      return reject(new Error("Malware detected: EICAR test signature found"));
    }

    // 2. Connect to clamd daemon
    const socket = net.createConnection({ port, host });
    socket.setTimeout(5000); // 5 seconds timeout

    let response = "";

    socket.on("connect", () => {
      // Send clamd INSTREAM command (using null-terminated syntax)
      socket.write("zINSTREAM\0");

      // Send chunk size prefix as 4-byte big-endian unsigned integer
      const sizeHeader = Buffer.alloc(4);
      sizeHeader.writeUInt32BE(buffer.length, 0);

      socket.write(sizeHeader);
      socket.write(buffer);

      // Send 0-size chunk to terminate INSTREAM
      const endHeader = Buffer.alloc(4);
      endHeader.writeUInt32BE(0, 0);
      socket.write(endHeader);
    });

    socket.on("data", (data) => {
      response += data.toString();
    });

    socket.on("end", () => {
      socket.destroy();
      const cleanedResponse = response.trim();
      console.log(`[ANTIVIRUS] ClamAV response: ${cleanedResponse}`);
      
      if (cleanedResponse.includes("FOUND")) {
        console.warn(`[SECURITY MONITORING] Malware detected by ClamAV in ${filename}: ${cleanedResponse}`);
        reject(new Error("Malware detected in uploaded file"));
      } else {
        resolve(true); // File is clean
      }
    });

    const clamavRequired =
      process.env.CLAMAV_REQUIRED === "true" || process.env.NODE_ENV === "production";

    socket.on("error", (err) => {
      socket.destroy();
      if (clamavRequired) {
        console.error(`[ANTIVIRUS] ClamAV connection failed (required): ${err.message}`);
        reject(new Error("Layanan pemindaian antivirus tidak tersedia"));
        return;
      }
      console.warn(`[ANTIVIRUS] ClamAV connection failed: ${err.message}. Falling back to clean scan.`);
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      if (clamavRequired) {
        console.error("[ANTIVIRUS] ClamAV scan timed out (required)");
        reject(new Error("Pemindaian antivirus melebihi batas waktu"));
        return;
      }
      console.warn("[ANTIVIRUS] ClamAV scan timed out. Falling back to clean scan.");
      resolve(true);
    });
  });
}
