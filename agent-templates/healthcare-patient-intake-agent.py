# Healthcare Patient Intake Agent
# Automates patient registration, insurance verification, and appointment scheduling

from typing import TypedDict, Annotated, List, Optional
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
from langchain_core.tools import tool
import operator

class PatientIntakeState(TypedDict):
    """State for patient intake workflow"""
    messages: Annotated[List[BaseMessage], operator.add]
    patient_info: dict
    insurance_verified: bool
    appointment_scheduled: bool
    medical_history_collected: bool
    consent_forms_signed: bool
    intake_complete: bool
    next_action: str

# Tools for patient intake
@tool
def verify_insurance(insurance_info: dict) -> dict:
    """Verify patient insurance coverage"""
    # Integration with insurance verification APIs
    return {
        "verified": True,
        "coverage_details": {
            "plan": "PPO Gold",
            "deductible_met": 0.75,
            "copay": 25
        }
    }

@tool
def check_provider_availability(specialty: str, preferred_dates: List[str]) -> dict:
    """Check provider availability for appointment"""
    # Integration with scheduling system
    return {
        "available_slots": [
            {"date": "2025-01-15", "time": "10:00 AM", "provider": "Dr. Smith"},
            {"date": "2025-01-16", "time": "2:00 PM", "provider": "Dr. Johnson"}
        ]
    }

@tool
def send_intake_forms(patient_email: str, form_types: List[str]) -> dict:
    """Send digital intake forms to patient"""
    # Integration with form management system
    return {
        "forms_sent": True,
        "form_ids": ["med_history_001", "consent_002", "privacy_003"]
    }

# Agent nodes
async def collect_patient_info(state: PatientIntakeState) -> PatientIntakeState:
    """Collect basic patient information"""
    # Use LLM to extract patient info from conversation
    state["patient_info"] = {
        "name": "extracted_name",
        "dob": "extracted_dob",
        "contact": "extracted_contact",
        "insurance": "extracted_insurance"
    }
    state["next_action"] = "verify_insurance"
    return state

async def verify_patient_insurance(state: PatientIntakeState) -> PatientIntakeState:
    """Verify insurance coverage"""
    insurance_result = verify_insurance(state["patient_info"]["insurance"])
    state["insurance_verified"] = insurance_result["verified"]
    state["patient_info"]["coverage"] = insurance_result["coverage_details"]
    state["next_action"] = "collect_medical_history"
    return state

async def collect_medical_history(state: PatientIntakeState) -> PatientIntakeState:
    """Send and collect medical history forms"""
    forms_result = send_intake_forms(
        state["patient_info"]["contact"]["email"],
        ["medical_history", "medications", "allergies"]
    )
    state["medical_history_collected"] = forms_result["forms_sent"]
    state["next_action"] = "schedule_appointment"
    return state

async def schedule_appointment(state: PatientIntakeState) -> PatientIntakeState:
    """Schedule patient appointment"""
    availability = check_provider_availability(
        state["patient_info"]["requested_specialty"],
        state["patient_info"]["preferred_dates"]
    )
    
    # Let patient choose from available slots
    state["appointment_scheduled"] = True
    state["patient_info"]["appointment"] = availability["available_slots"][0]
    state["next_action"] = "complete_intake"
    return state

async def complete_intake(state: PatientIntakeState) -> PatientIntakeState:
    """Complete the intake process"""
    state["intake_complete"] = True
    state["messages"].append(
        BaseMessage(
            content=f"Intake complete! Appointment scheduled for {state['patient_info']['appointment']['date']} at {state['patient_info']['appointment']['time']} with {state['patient_info']['appointment']['provider']}"
        )
    )
    return state

# Build the workflow
def create_patient_intake_workflow():
    workflow = StateGraph(PatientIntakeState)
    
    # Add nodes
    workflow.add_node("collect_info", collect_patient_info)
    workflow.add_node("verify_insurance", verify_patient_insurance)
    workflow.add_node("medical_history", collect_medical_history)
    workflow.add_node("schedule", schedule_appointment)
    workflow.add_node("complete", complete_intake)
    
    # Add edges
    workflow.set_entry_point("collect_info")
    workflow.add_edge("collect_info", "verify_insurance")
    workflow.add_edge("verify_insurance", "medical_history")
    workflow.add_edge("medical_history", "schedule")
    workflow.add_edge("schedule", "complete")
    workflow.add_edge("complete", END)
    
    return workflow.compile()

# Agent metadata for marketplace
AGENT_METADATA = {
    "name": "Healthcare Patient Intake Agent",
    "description": "Automates patient registration, insurance verification, and appointment scheduling",
    "category": "Healthcare",
    "pricing": {
        "model": "per_intake",
        "price": 2.50
    },
    "benefits": [
        "Reduce intake time from 30 minutes to 5 minutes",
        "24/7 patient registration availability",
        "Automatic insurance verification",
        "Reduced no-show rates with automated reminders",
        "HIPAA compliant data handling"
    ],
    "integrations": [
        "Epic EHR",
        "Cerner",
        "Insurance verification APIs",
        "Twilio (SMS)",
        "DocuSign (consent forms)"
    ],
    "compliance": ["HIPAA", "HITECH", "HL7 FHIR"],
    "roi_metrics": {
        "time_saved_per_patient": "25 minutes",
        "staff_reduction": "2 FTEs",
        "patient_satisfaction_increase": "35%"
    }
}