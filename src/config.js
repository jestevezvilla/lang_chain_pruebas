import dotenv from 'dotenv';
import path from 'path';

const __dirname = process.env.PWD;
const config = dotenv.config({ path: path.resolve(__dirname, `.env`) })

export default config;;