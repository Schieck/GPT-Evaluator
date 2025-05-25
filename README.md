# GPT-Evaluator

A Chrome extension that helps evaluate and analyze AI responses in real-time. This tool provides insights into the quality and accuracy of AI-generated content, making it easier to assess and improve AI interactions.

## Features

- **Live Scanner**: Monitor and analyze GPT conversations in real-time with automatic evaluation
- **Legacy Evaluator**: Manual evaluation of AI responses against user inputs with detailed analysis
- **History Tracking**: Comprehensive history of past evaluations with approval/rejection functionality
- **Multi-Provider Support**: Works with both OpenAI and Claude AI providers
- **Configurable**: Easy setup with API key management and provider settings
- **Error Handling**: Robust error handling and reporting system

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
   > If you need to run it locally with hot reload, run `npm run dev` and select the dist as same as the build.

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the build output

## Usage

1. **Live Scanner**:
   - Click the "Live" tab to start monitoring ChatGPT conversations
   - View real-time evaluation metrics and scores
   - Track conversation quality over time

2. **Legacy Evaluator**:
   - Enter your prompt in the "User Input" field
   - Paste the AI response in the "AI Response" field
   - Get instant evaluation results
   - Collapsible input fields for better space management

3. **History**:
   - View all past evaluations
   - Approve or reject evaluations
   - Track conversation timestamps and results

4. **Configuration**:
   - Add your API keys for OpenAI and/or Claude
   - Customize evaluation settings
   - Manage your preferences

## Development

This project is built with:
- React
- TypeScript
- Framer Motion for animations
- Tailwind CSS for styling
- Chrome Extension APIs

### Project Structure

```
src/
├── components/         # React components
├── services/          # Business logic and API services
│   ├── providers/     # AI provider implementations
│   └── types.ts       # Type definitions
├── utils/             # Utility functions
└── popup/             # Extension popup UI
```

### Documentation

- **[AI Provider System](docs/PROVIDER_SYSTEM.md)** - Guide for adding new AI providers
- **[Live Validator System](docs/VALIDATOR_SYSTEM.md)** - Guide for creating live validators

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.