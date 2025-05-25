# Live Validator System

Create real-time validators for ChatGPT conversations in just 30 minutes. The Live Validator System provides a simple, unified way to monitor and validate AI interactions.

## 🚀 Quick Start

### Create a Validator in 3 Steps

1. **Copy the template:**
   ```bash
   cp src/content-scripts/validators/ValidatorTemplate.ts src/content-scripts/validators/MyValidator.ts
   ```

2. **Implement your logic:**
   ```typescript
   export class MyValidator extends LiveValidator {
     constructor() {
       super({
         name: 'my-validator',
         targetSelectors: ['.chat-message'],
         triggerEvents: ['input', 'change']
       });
     }

     async validate(element: Element): Promise<any> {
       const text = element.textContent || '';
       return {
         isValid: text.length > 10,
         score: Math.min(text.length / 5, 100)
       };
     }

     createTooltipContent(data: any): HTMLElement {
       const div = document.createElement('div');
       div.textContent = `Score: ${data.score}%`;
       return div;
     }
   }

   new MyValidator(); // Auto-register
   ```

3. **Add to index:**
   ```typescript
   // In validators/index.ts
   import './MyValidator';
   ```

Done! Your validator is now active on ChatGPT.

## 📋 Core Concepts

### What You Need to Implement

Just two methods:
- `validate(element)` - Your validation logic
- `createTooltipContent(data)` - Your tooltip UI

Everything else is handled automatically:
- ✅ Element monitoring
- ✅ Event handling
- ✅ Tooltip positioning
- ✅ Message passing
- ✅ Cleanup

### File Structure

```
src/content-scripts/
├── validators/
│   ├── index.ts              # Auto-loader
│   ├── ValidatorTemplate.ts  # Copy this
│   └── YourValidator.ts      # Your validators
└── base/
    └── LiveValidator.ts      # Base class (don't modify)
```

## 🔧 Configuration

```typescript
interface ValidatorConfig {
  name: string;               // Unique identifier
  targetSelectors: string[];  // What to monitor
  triggerEvents: string[];    // When to validate
  debounceMs?: number;        // Delay (default: 500ms)
}
```

### Common Selectors

```typescript
// Monitor all messages
['.chat-message']

// Only AI responses
['[data-message-author-role="assistant"]']

// Only user messages
['[data-message-author-role="user"]']
```

### Common Events

```typescript
['input', 'change']           // Text changes
['DOMSubtreeModified']        // DOM changes
['keyup', 'paste']            // User input
```

## 🎨 Examples

### Text Length Validator

```typescript
export class TextLengthValidator extends LiveValidator {
  constructor() {
    super({
      name: 'text-length',
      targetSelectors: ['.chat-message'],
      triggerEvents: ['input']
    });
  }

  async validate(element: Element): Promise<any> {
    const length = (element.textContent || '').length;
    return {
      score: Math.min(100, length / 10),
      message: length < 100 ? 'Too short' : 'Good length'
    };
  }

  createTooltipContent(data: any): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = `
      <div>Length: ${data.score}%</div>
      <div>${data.message}</div>
    `;
    return div;
  }
}

new TextLengthValidator();
```

### Sentiment Validator

```typescript
export class SentimentValidator extends LiveValidator {
  constructor() {
    super({
      name: 'sentiment',
      targetSelectors: ['[data-message-author-role="assistant"]'],
      triggerEvents: ['DOMSubtreeModified'],
      debounceMs: 1000
    });
  }

  async validate(element: Element): Promise<any> {
    const text = element.textContent || '';
    const positive = ['good', 'great', 'excellent'].filter(w => 
      text.toLowerCase().includes(w)
    ).length;
    const negative = ['bad', 'poor', 'terrible'].filter(w => 
      text.toLowerCase().includes(w)
    ).length;
    
    const sentiment = positive - negative;
    
    return {
      score: 50 + (sentiment * 25),
      sentiment: sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'
    };
  }

  createTooltipContent(data: any): HTMLElement {
    const div = document.createElement('div');
    const color = data.score > 50 ? '#22c55e' : data.score < 50 ? '#ef4444' : '#6b7280';
    div.innerHTML = `<div style="color: ${color}">${data.sentiment} (${data.score}%)</div>`;
    return div;
  }
}

new SentimentValidator();
```

## 🔍 Advanced Features

### Custom Messages

```typescript
// Handle custom messages
public onCustomMessage(message: any): void {
  if (message.type === 'HIGHLIGHT') {
    this.highlightElements();
  }
}
```

### Element Changes

```typescript
// React to element changes
public onElementChanged(element: Element): void {
  console.log('Element changed:', element);
  this.validate(element);
}
```

### Error Handling

```typescript
async validate(element: Element): Promise<any> {
  try {
    // Your logic
  } catch (error) {
    console.error(`[${this.config.name}] Error:`, error);
    return { score: 0, error: error.message };
  }
}
```

## 🛠️ Development Tips

### Testing

```bash
# Start dev server
npm run dev

# Check console for registration
# Look for: "[ValidatorRegistry] ✅ Registered validator: my-validator"
```

### Debugging

```typescript
async validate(element: Element): Promise<any> {
  console.log(`[${this.config.name}] Validating:`, element);
  // Your logic
}
```

### Performance

- Use appropriate debounce (300-1000ms)
- Cache expensive operations
- Keep validation logic simple

## 🚨 Troubleshooting

**Validator not working?**
1. Check console for errors
2. Verify it's imported in `validators/index.ts`
3. Confirm selectors match DOM elements
4. Try simpler selectors/events first

**Tooltip not showing?**
1. Ensure `createTooltipContent` returns an HTMLElement
2. Check for CSS conflicts
3. Verify validation returns data

## 📚 API Reference

### LiveValidator Methods

**Required:**
- `validate(element): Promise<any>` - Your validation logic
- `createTooltipContent(data): HTMLElement` - Your tooltip UI

**Optional:**
- `onCustomMessage(message): void` - Handle custom messages
- `onElementChanged(element): void` - React to changes
- `cleanup(): void` - Custom cleanup

**Inherited:**
- `showTooltip(data): void` - Show tooltip
- `hideTooltip(): void` - Hide tooltip
- `sendMessage(type, payload): void` - Send messages

### ValidatorConfig

```typescript
{
  name: string;               // Required: unique ID
  targetSelectors: string[];  // Required: CSS selectors
  triggerEvents: string[];    // Required: DOM events
  debounceMs?: number;        // Optional: delay (default 500)
  autoRegister?: boolean;     // Optional: auto-register (default true)
}
```

## 🎯 Best Practices

1. **Keep it simple** - Focus on one validation task
2. **Use clear names** - `grammar-checker`, not `validator1`
3. **Handle errors** - Always return something
4. **Test early** - Start with console logs
5. **Document behavior** - Add comments for complex logic

The Live Validator System handles all the complexity so you can focus on your validation logic. Happy validating! 🎉 