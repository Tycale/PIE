from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import base64
import os
import json
import logging
from dotenv import load_dotenv
from openai import OpenAI
from openai import OpenAIError
import io
from mangum import Mangum
import PyPDF2

# Logging configuration
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Loading environment variables
load_dotenv()

app = FastAPI(root_path="/prod")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://pie.initia.cloud", "https://api.pie.initia.cloud"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.post("/api/extract")
async def extract(file: UploadFile = File(...)):
    # Read the uploaded file
    try:
        contents = await file.read()
    except Exception as e:
        logging.error(f"Error reading the file: {str(e)}")
        raise HTTPException(status_code=400, detail="Error reading the file")

    # Check the file content type
    if file.content_type.lower() == 'application/pdf':
        # Processing for PDF files
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            text = ''
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text()
        except Exception as e:
            logging.error(f"Error processing the PDF file: {str(e)}")
            raise HTTPException(status_code=400, detail="Error processing the PDF file")

        # Préparer les messages pour l'API OpenAI
        messages = [
            {
                "role": "system",
                "content": "You are an assistant that extracts specific information from invoices."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this invoice text extracted from a PDF and extract the following information:\n"
                                "1. Name of the beneficiary\n"
                                "2. IBAN account number of the beneficiary\n"
                                "3. Amount to be paid (in the following format: XXXXX.YY, without currencies or symbol at the end)\n"
                                "4. Communication or reference\n\n"
                                "Present the results as a JSON object with the fields 'name', 'account', 'amount', and 'communication'. "
                                "All fields are optional. If any information is not found, omit the field from the JSON object. Verify every number twice."
                    },
                    {
                        "type": "text",
                        "text": f"Extracted text:\n{text}"
                    }
                ]
            }
        ]
    else:
        # Processing for images
        try:
            # Encode the image in base64
            base64_image = base64.b64encode(contents).decode('utf-8')
        except Exception as e:
            logging.error(f"Error processing the image: {str(e)}")
            raise HTTPException(status_code=400, detail="Error processing the image")

        # Préparer les messages pour l'API OpenAI
        messages = [
            {
                "role": "system",
                "content": "You are an assistant that extracts specific information from invoice images."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this invoice image and extract the following information:\n"
                                "1. Name of the beneficiary\n"
                                "2. IBAN account number of the beneficiary\n"
                                "3. Amount to be paid (in the following format: XXXXX.YY, without currencies or symbol at the end)\n"
                                "4. Communication or reference\n\n"
                                "Present the results as a JSON object with the fields 'name', 'account', 'amount', and 'communication'. "
                                "All fields are optional. If any information is not found, omit the field from the JSON object. Verify every number twice."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]

    # OpenAI API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logging.error("OpenAI API key not found")
        raise HTTPException(status_code=500, detail="OpenAI API key not found")

    client = OpenAI(api_key=api_key)

    # Define the model version
    MODEL_VERSION = "gpt-4o-2024-08-06"

    try:
        response = client.chat.completions.create(
            model=MODEL_VERSION,
            messages=messages,
            max_tokens=400,
            temperature=0,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "invoice_data",
                    "strict": False,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "account": {"type": "string"},
                            "amount": {"type": "string"},
                            "communication": {"type": "string"}
                        },
                        "additionalProperties": False
                    }
                }
            }
        )

        if not response or not response.choices:
            logging.error("The OpenAI API returned an empty response")
            raise HTTPException(status_code=500, detail="The OpenAI API returned an empty response")

        # Extract the content of the OpenAI response
        result = json.loads(response.choices[0].message.content)

        # The result should already be a JSON object, no need to parse it
        return result

    except OpenAIError as e:
        logging.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# Créer une instance Mangum
@app.get("/")
async def root():
    return {"message": "Hello from FastAPI on AWS Lambda!"}

handler = Mangum(app, lifespan="off")
