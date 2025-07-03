# E-commerce Customer Service Agent
# Handles order inquiries, returns, refunds, and product recommendations

from typing import TypedDict, Annotated, List, Optional, Literal
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
from langchain_core.tools import tool
import operator

class CustomerServiceState(TypedDict):
    """State for customer service workflow"""
    messages: Annotated[List[BaseMessage], operator.add]
    customer_id: Optional[str]
    order_id: Optional[str]
    issue_type: Optional[Literal["order_status", "return", "refund", "product_question", "other"]]
    issue_resolved: bool
    escalation_needed: bool
    sentiment_score: float
    resolution_details: dict
    next_action: str

# Tools for customer service
@tool
def lookup_order(order_id: str, customer_email: str) -> dict:
    """Look up order details from e-commerce platform"""
    # Integration with Shopify/WooCommerce/etc
    return {
        "order_id": order_id,
        "status": "shipped",
        "tracking_number": "1Z999AA10123456784",
        "items": [
            {"name": "Wireless Headphones", "quantity": 1, "price": 89.99}
        ],
        "estimated_delivery": "2025-01-20"
    }

@tool
def process_return(order_id: str, items: List[str], reason: str) -> dict:
    """Process a return request"""
    return {
        "return_id": "RET-2025-001",
        "return_label": "https://returns.example.com/label/RET-2025-001",
        "refund_amount": 89.99,
        "refund_timeline": "5-7 business days after receipt"
    }

@tool
def check_inventory(product_id: str) -> dict:
    """Check product inventory levels"""
    return {
        "in_stock": True,
        "quantity_available": 45,
        "restock_date": None,
        "alternative_products": ["PROD-456", "PROD-789"]
    }

@tool
def create_support_ticket(issue_details: dict, priority: str) -> dict:
    """Create support ticket for escalation"""
    return {
        "ticket_id": "SUP-2025-12345",
        "assigned_to": "Level 2 Support",
        "estimated_response": "2 hours"
    }

# Agent nodes
async def identify_customer_issue(state: CustomerServiceState) -> CustomerServiceState:
    """Identify the type of customer issue using NLU"""
    # Analyze customer message to determine issue type
    # This would use an LLM to classify the issue
    
    state["issue_type"] = "order_status"  # Example classification
    state["sentiment_score"] = 0.7  # Positive sentiment
    
    # Route to appropriate handler
    if state["issue_type"] == "order_status":
        state["next_action"] = "check_order"
    elif state["issue_type"] == "return":
        state["next_action"] = "process_return"
    else:
        state["next_action"] = "general_support"
    
    return state

async def check_order_status(state: CustomerServiceState) -> CustomerServiceState:
    """Check and communicate order status"""
    order_details = lookup_order(
        state["order_id"],
        state["customer_id"]
    )
    
    response = f"""I found your order! Here's the status:
    
    Order #{order_details['order_id']} - {order_details['status'].upper()}
    Tracking: {order_details['tracking_number']}
    Estimated delivery: {order_details['estimated_delivery']}
    
    You can track your package at: https://track.carrier.com/{order_details['tracking_number']}
    """
    
    state["messages"].append(BaseMessage(content=response))
    state["issue_resolved"] = True
    state["resolution_details"] = order_details
    state["next_action"] = "check_satisfaction"
    
    return state

async def handle_return_request(state: CustomerServiceState) -> CustomerServiceState:
    """Process return request"""
    return_result = process_return(
        state["order_id"],
        state["resolution_details"]["items_to_return"],
        state["resolution_details"]["return_reason"]
    )
    
    response = f"""I've processed your return request:
    
    Return ID: {return_result['return_id']}
    Refund amount: ${return_result['refund_amount']}
    
    Please use this link to print your return label: {return_result['return_label']}
    
    Your refund will be processed {return_result['refund_timeline']}.
    """
    
    state["messages"].append(BaseMessage(content=response))
    state["issue_resolved"] = True
    state["next_action"] = "check_satisfaction"
    
    return state

async def check_customer_satisfaction(state: CustomerServiceState) -> CustomerServiceState:
    """Check if customer is satisfied with resolution"""
    if state["sentiment_score"] < 0.5 or not state["issue_resolved"]:
        state["escalation_needed"] = True
        state["next_action"] = "escalate"
    else:
        state["next_action"] = "complete"
    
    return state

async def escalate_to_human(state: CustomerServiceState) -> CustomerServiceState:
    """Escalate to human agent"""
    ticket = create_support_ticket(
        {
            "customer_id": state["customer_id"],
            "issue_type": state["issue_type"],
            "conversation_history": state["messages"]
        },
        priority="high" if state["sentiment_score"] < 0.3 else "normal"
    )
    
    response = f"""I'll connect you with a specialist who can better assist you.
    
    Your ticket number is: {ticket['ticket_id']}
    Expected response time: {ticket['estimated_response']}
    
    Is there anything else I can help you with while you wait?
    """
    
    state["messages"].append(BaseMessage(content=response))
    state["next_action"] = "complete"
    
    return state

async def complete_interaction(state: CustomerServiceState) -> CustomerServiceState:
    """Complete the customer interaction"""
    state["messages"].append(
        BaseMessage(content="Thank you for shopping with us! Have a great day! 😊")
    )
    return state

# Build the workflow
def create_customer_service_workflow():
    workflow = StateGraph(CustomerServiceState)
    
    # Add nodes
    workflow.add_node("identify", identify_customer_issue)
    workflow.add_node("check_order", check_order_status)
    workflow.add_node("process_return", handle_return_request)
    workflow.add_node("check_satisfaction", check_customer_satisfaction)
    workflow.add_node("escalate", escalate_to_human)
    workflow.add_node("complete", complete_interaction)
    
    # Add conditional edges
    workflow.set_entry_point("identify")
    
    # Route based on issue type
    workflow.add_conditional_edges(
        "identify",
        lambda x: x["next_action"],
        {
            "check_order": "check_order",
            "process_return": "process_return",
            "general_support": "check_satisfaction"
        }
    )
    
    workflow.add_edge("check_order", "check_satisfaction")
    workflow.add_edge("process_return", "check_satisfaction")
    
    # Route based on satisfaction
    workflow.add_conditional_edges(
        "check_satisfaction",
        lambda x: x["next_action"],
        {
            "escalate": "escalate",
            "complete": "complete"
        }
    )
    
    workflow.add_edge("escalate", "complete")
    workflow.add_edge("complete", END)
    
    return workflow.compile()

# Agent metadata for marketplace
AGENT_METADATA = {
    "name": "E-commerce Customer Service Agent",
    "description": "AI-powered customer service for online stores - handles orders, returns, and product inquiries",
    "category": "E-commerce",
    "pricing": {
        "model": "per_conversation",
        "price": 0.25
    },
    "benefits": [
        "24/7 customer support availability",
        "80% reduction in support tickets",
        "< 30 second average response time",
        "Handles multiple languages",
        "Increases customer satisfaction by 40%"
    ],
    "integrations": [
        "Shopify",
        "WooCommerce",
        "BigCommerce",
        "Stripe",
        "PayPal",
        "Major shipping carriers",
        "Zendesk",
        "Intercom"
    ],
    "supported_channels": [
        "Website chat",
        "Email",
        "SMS",
        "WhatsApp",
        "Facebook Messenger"
    ],
    "roi_metrics": {
        "cost_per_interaction": "$0.25 vs $5-10 human",
        "tickets_deflected": "80%",
        "average_resolution_time": "2 minutes",
        "customer_satisfaction": "4.7/5 stars"
    }
}