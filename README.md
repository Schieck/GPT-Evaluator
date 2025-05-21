# GPT-Evaluator

A Chrome extension that helps evaluate and analyze AI responses in real-time. This tool provides insights into the quality and accuracy of AI-generated content, making it easier to assess and improve AI interactions.

## Features

- **Real-time Evaluation**: Instantly evaluate AI responses against user inputs
- **Live Chat Scanning**: Monitor and analyze GPT conversations in real-time
- **History Tracking**: Keep track of past evaluations and their results
- **Multi-Provider Support**: Works with both OpenAI and Claude AI providers
- **Modern UI**: Beautiful and intuitive interface with smooth animations
- **Configurable**: Easy setup with API key management

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

1. **Basic Evaluation**:
   - Enter your prompt in the "User Input" field
   - Paste the AI response in the "AI Response" field
   - Get instant evaluation results

2. **Live Scanning**:
   - Click the play button to start monitoring ChatGPT conversations
   - View real-time evaluation metrics and scores
   - Track conversation quality over time

3. **Configuration**:
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
├── utils/             # Utility functions
└── popup/             # Extension popup UI
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.