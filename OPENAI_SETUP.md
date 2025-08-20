# OpenAI Integration Setup

This application includes AI-powered features for generating product descriptions and images using OpenAI's APIs.

## Prerequisites

1. **OpenAI Account**: You need an active OpenAI account with API access
2. **API Key**: Generate an API key from the OpenAI platform
3. **Credits**: Ensure you have sufficient credits for API usage

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click "Create new secret key"
4. Copy the generated API key (starts with `sk-proj-` or `sk-`)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root and add your API key:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

**Example:**

```bash
OPENAI_API_KEY=sk-proj-abc123def456ghi789jklmno...
```

### 3. Restart the Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

### 🤖 AI Description Generation

- **Location**: Product create/edit pages
- **Trigger**: Click "AI Generate" button in the Description section
- **Requirements**: Product name must be filled
- **Model**: GPT-3.5-turbo
- **Cost**: ~$0.001-0.002 per description

**How it works:**

1. Enter a product name
2. Optionally fill in category and existing description
3. Click "AI Generate" button
4. AI generates professional product description
5. Description is populated in the form field

### 🎨 AI Image Generation

- **Location**: Product create/edit pages (when no image is set)
- **Trigger**: Click "AI Generate" button in the AI Image Generation section
- **Requirements**: Product name must be filled
- **Model**: DALL-E 3
- **Cost**: ~$0.040 per image (1024x1024)

**How it works:**

1. Enter a product name and optionally a description
2. Click "AI Generate" in the image section
3. AI generates a professional product image
4. Image is automatically uploaded to EPCC Files
5. Image is set as the product's main image

## Cost Considerations

### Description Generation (GPT-3.5-turbo)

- **Input**: ~50-200 tokens per request
- **Output**: ~100-300 tokens per response
- **Cost**: ~$0.001-0.002 per description
- **Monthly estimate**: $5-20 for 5,000 descriptions

### Image Generation (DALL-E 3)

- **Cost**: $0.040 per 1024x1024 image
- **Monthly estimate**: $40-200 for 1,000-5,000 images

### Total estimated monthly cost for moderate usage:

- **100 descriptions + 50 images**: ~$2.20
- **1,000 descriptions + 500 images**: ~$22
- **5,000 descriptions + 1,000 images**: ~$50

## Error Handling

The application handles various error scenarios:

### Common Errors:

- **No API Key**: "OpenAI API key not configured"
- **Invalid API Key**: "Invalid OpenAI API key"
- **Quota Exceeded**: "OpenAI API quota exceeded"
- **Rate Limit**: "Rate limit exceeded. Please try again later."
- **Content Policy**: "Image generation request violates content policy"

### Troubleshooting:

1. **API Key Issues**:

   - Verify the key is correct in `.env.local`
   - Ensure the key has proper permissions
   - Check if the key is active

2. **Quota Issues**:

   - Check your OpenAI billing dashboard
   - Add credits to your account
   - Upgrade your plan if needed

3. **Rate Limiting**:
   - Wait a few minutes before retrying
   - Consider implementing request throttling

## Security Best Practices

1. **Never commit API keys**: Keep `.env.local` in `.gitignore`
2. **Use environment variables**: Never hardcode API keys
3. **Monitor usage**: Set up billing alerts in OpenAI dashboard
4. **Rotate keys**: Periodically regenerate API keys
5. **Limit access**: Use API keys with minimal required permissions

## Usage Tips

### For Better Descriptions:

- Use descriptive product names
- Fill in product categories
- Provide existing descriptions for improvement
- Review and edit generated content

### For Better Images:

- Use clear, specific product names
- Include key product features in descriptions
- Specify materials, colors, or styles in the name
- Use consistent naming conventions

## API Rate Limits

### GPT-3.5-turbo:

- **Free tier**: 3 requests per minute
- **Paid tier**: 3,500 requests per minute

### DALL-E 3:

- **All tiers**: 5 requests per minute

## Support

For OpenAI-related issues:

- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Support](https://help.openai.com/)
- [OpenAI Status Page](https://status.openai.com/)

For application-specific issues:

- Check browser console for error messages
- Verify API key configuration
- Test with simple product names first
