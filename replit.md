# Dialogflow WhatsApp Webhook

## Overview

This project is a webhook service that bridges WhatsApp messaging (via Whapi) with Google Dialogflow for natural language processing. It receives incoming WhatsApp messages, processes them through Dialogflow to understand user intent and generate responses, then sends replies back through WhatsApp. The service is designed to create an automated conversational bot that responds in Spanish.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture Pattern
- **Express.js Server**: Single-file Node.js application using Express for HTTP handling
- **Webhook-based Integration**: Acts as middleware between two external services (Whapi and Dialogflow)
- **Stateless Request Handling**: Each message is processed independently using session IDs derived from chat IDs

### Message Flow
1. Whapi sends incoming WhatsApp messages to `/webhook` endpoint
2. Server extracts message text and chat ID from the payload
3. Message is sent to Dialogflow for intent detection
4. Dialogflow response is sent back to WhatsApp via Whapi API

### Configuration Approach
- **Service Account Authentication**: Uses Google Cloud service account credentials stored in `credentials.json`
- **Environment Variables**: Sensitive tokens (WHAPI_TOKEN) stored as environment variables
- **Hardcoded Project Settings**: Dialogflow project ID and language code are hardcoded (Spanish - "es")

### Session Management
- Uses Dialogflow's built-in session management
- Sessions are identified by WhatsApp chat IDs, enabling conversation context persistence per user

## External Dependencies

### Google Cloud Dialogflow
- **Purpose**: Natural language understanding and response generation
- **SDK**: `@google-cloud/dialogflow` v5.4.0
- **Authentication**: Service account credentials in `credentials.json`
- **Project ID**: `newagent-kcma`

### Whapi (WhatsApp API)
- **Purpose**: WhatsApp message receiving and sending
- **Integration**: REST API via axios
- **Authentication**: Bearer token via `WHAPI_TOKEN` environment variable
- **Webhook Endpoint**: `/webhook` receives incoming messages

### Environment Variables Required
- `PORT`: Server port (defaults to 5000)
- `WHAPI_TOKEN`: Authentication token for Whapi API

### NPM Dependencies
- `express`: Web server framework
- `body-parser`: JSON request parsing
- `@google-cloud/dialogflow`: Dialogflow client SDK
- `axios`: HTTP client for Whapi API calls