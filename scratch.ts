import { getCompanyById } from "./src/lib/companies";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
    // Just finding the first company from DB to test
    const { getCompanies } = await import("./src/lib/companies");
    const list = await getCompanies(1, 1);
    if(list.data.length > 0) {
        const item = await getCompanyById(list.data[0].id);
        console.log("Mapped Company:", item);
    }
}
main();
