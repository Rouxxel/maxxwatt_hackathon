"""
AI Analysis router for BESS energy data using OpenAI
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import os
from openai import OpenAI
from utils.prompts import BESSPromptManager

router = APIRouter()

class AIAnalysisRequest(BaseModel):
    json_data: Dict[str, Any]
    prompt_type: str
    custom_prompt: Optional[str] = None
    model: Optional[str] = "gpt-4o-mini"
    max_tokens: Optional[int] = 2000

class AIAnalysisResponse(BaseModel):
    analysis: str
    prompt_type: str
    model_used: str
    tokens_used: Optional[int] = None
    success: bool

# Initialize OpenAI client
def get_openai_client():
    """Get OpenAI client with API key"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    return OpenAI(api_key=api_key)

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_bess_data(request: AIAnalysisRequest):
    """
    Analyze BESS energy data using OpenAI

    - **json_data**: BESS data in JSON format for analysis
    - **prompt_type**: Type of analysis ('performance', 'degradation', 'safety', 'anomaly')
    - **custom_prompt**: Optional custom prompt (overrides prompt_type if provided)
    - **model**: OpenAI model to use (default: gpt-4)
    - **max_tokens**: Maximum tokens for response (default: 2000)
    """
    try:
        client = get_openai_client()

        # Get the appropriate prompt
        if request.custom_prompt:
            system_prompt = request.custom_prompt
            prompt_type_used = "custom"
        else:
            print(f"Getting prompt for type: {request.prompt_type}")
            system_prompt = BESSPromptManager.get_prompt_by_type(request.prompt_type)
            prompt_type_used = request.prompt_type

            if "Invalid prompt type" in system_prompt:
                raise HTTPException(status_code=400, detail=system_prompt)

            print(f"Prompt length: {len(system_prompt)} characters")

        # Prepare the data for analysis
        json_data_str = json.dumps(request.json_data, indent=2)
        print(f"Data size: {len(json_data_str)} characters")

        # Call OpenAI API with proper system/user message structure
        print(f"Calling OpenAI API with model: {request.model}")
        try:
            response = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this BESS data:\n\n{json_data_str}"}
                ],
                max_tokens=request.max_tokens,
                temperature=0.1  # Lower temperature for more consistent analysis
            )
            print("OpenAI API call successful")
        except Exception as openai_error:
            print(f"OpenAI API error: {openai_error}")
            raise

        analysis_result = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None

        return AIAnalysisResponse(
            analysis=analysis_result,
            prompt_type=prompt_type_used,
            model_used=request.model,
            tokens_used=tokens_used,
            success=True
        )

    except Exception as e:
        import traceback
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        print(f"AI Analysis Error: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing BESS data: {str(e)}"
        )

@router.get("/prompts")
async def get_available_prompts():
    """
    Get list of available prompt types and their descriptions
    """
    return {
        "available_prompts": BESSPromptManager.list_available_prompts(),
        "usage": {
            "endpoint": "/ai/analyze",
            "method": "POST",
            "parameters": {
                "json_data": "BESS data in JSON format",
                "prompt_type": "One of the available prompt types",
                "custom_prompt": "Optional custom prompt (overrides prompt_type)",
                "model": "OpenAI model (default: gpt-4)",
                "max_tokens": "Maximum response tokens (default: 2000)"
            }
        },
        "example_request": {
            "json_data": {"device_id": "ZHPESS232A230002", "data": "..."},
            "prompt_type": "performance",
            "model": "gpt-4",
            "max_tokens": 2000
        }
    }

@router.get("/device-analysis/{device_id}")
async def analyze_device_data(
    device_id: str,
    prompt_type: str,
    batch_size: int = 100,
    custom_prompt: Optional[str] = None,
    model: Optional[str] = "gpt-4o-mini",
    date: Optional[str] = None
):
    """
    Get device data and analyze it directly

    - **device_id**: BESS device identifier
    - **prompt_type**: Type of analysis to perform
    - **batch_size**: Number of records to fetch for analysis
    - **custom_prompt**: Optional custom prompt
    - **model**: OpenAI model to use (default: gpt-4o-mini)
    - **date**: Target date for data (YYYY-MM-DD or YYYY-MM)
    """
    try:
        # Import here to avoid circular imports
        from routers.bess import get_cached_manager

        # Get device data with date parameter
        manager = get_cached_manager(device_id, date)
        bess_data = manager.get_data(batch_size=batch_size)

        # Convert to dict for analysis
        data_dict = {
            "device_id": bess_data.device_id,
            "total_records": bess_data.total_records,
            "batch_size": bess_data.batch_size,
            "data": [reading.model_dump() for reading in bess_data.data]
        }

        # Create analysis request
        analysis_request = AIAnalysisRequest(
            json_data=data_dict,
            prompt_type=prompt_type,
            custom_prompt=custom_prompt,
            model=model
        )

        # Perform analysis
        result = await analyze_bess_data(analysis_request)

        return {
            "device_id": device_id,
            "records_analyzed": len(bess_data.data),
            "analysis_result": result
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing device data: {str(e)}")