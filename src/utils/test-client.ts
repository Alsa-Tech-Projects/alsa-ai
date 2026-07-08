// test-client.ts
import { checkBridgeConnection, executeSystemCommand, sendCommand } from "./pcBridge";

(async () => {
  console.log(await checkBridgeConnection());

  // create folder on Desktop
  console.log(await executeSystemCommand("create folder MyTestFolder in C:\\Users\\Public"));

  // create file and write
  console.log(await executeSystemCommand("create file demo.txt in C:\\Users\\Public\\MyTestFolder"));
  console.log(await executeSystemCommand("write Hello from AI to file C:\\Users\\Public\\MyTestFolder\\demo.txt"));

  // open CMD at that folder
  console.log(await executeSystemCommand("open cmd at C:\\Users\\Public\\MyTestFolder"));

  // run a file (if you have C:\Users\Public\MyTestFolder\script.py)
  console.log(await executeSystemCommand("run file C:\\Users\\Public\\MyTestFolder\\script.py"));

  // quick app open
  console.log(await executeSystemCommand("open notepad"));
})();
