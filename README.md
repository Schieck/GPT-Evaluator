# GPT Evaluator

<p align="center">
  <img src="./public/favicon/favicon-96x96.png" alt="GPT Evaluator Logo" width="80" height="80" />
</p>

<p align="center">
  <b>A sleek Chrome extension for validating and evaluating AI-generated responses</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer%20Motion-latest-ff69b4" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=google-chrome" alt="Chrome Extension" />
</p>

---

## ✨ Features

- **Real-time Validation** - Evaluate AI responses against user prompts
- **Multiple AI Support** - Configure and use both OpenAI and Claude APIs
- **History Tracking** - Review past evaluations and results
- **Secure Storage** - API keys stored locally, never sent to servers

## 🚀 Installation

### Development Mode

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/GPT-Evaluator.git
   cd GPT-Evaluator
   ```

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
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder from the project

### Production Use

*Coming soon to the Chrome Web Store!*

## 💡 Usage

1. **Input Your Text**
   - Enter your original prompt in the "User Input" field
   - Paste the AI-generated response in the "AI Response" field

2. **Generate Evaluation**
   - Click the "Generate Evaluation" button to analyze the response quality

3. **View Results**
   - See detailed analysis and suggestions for improvement
   - Add your own feedback to save with the evaluation

4. **Configure API Keys**
   - Access settings by clicking the gear icon
   - Add your OpenAI and Claude API keys for enhanced evaluation

## 🛠️ Tech Stack

- **React 19** - Frontend framework
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **TypeScript** - Type safety and developer experience
- **Chrome Extension API** - Browser integration
- **Vite** - Build tool and development server

## 🗂️ Project Structure

```
src/
  ├── components/     # React components
  │   ├── history/    # History-related components
  │   └── ...
  ├── popup/          # Chrome extension popup
  ├── utils/          # Utility functions and helpers
  ├── assets/         # Static assets
  └── favicon/        # Extension icons
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ for AI enthusiasts and developers
</p>
