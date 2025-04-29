import { createServerFn } from '@tanstack/react-start';
import OpenAI from 'openai';

// Define the response structure
interface ProcessedScheduleItem {
  timestamp: string | null;
  title: string | null;
}

/**
 * Server function to process natural language input to extract schedule item details
 * @param input The natural language input describing a schedule item
 * @returns An object with timestamp and title
 */
export const processScheduleItem = createServerFn({ method: 'POST' })
  .validator(({ input }: { input: string }) => ({
    input,
  }))
  .handler(async (ctx) => {
    const { input } = ctx.data;
    try {
      // Create OpenAI client (server-side only)
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Check if the input includes a year
      const hasYear = /\b(20)\d{2}\b/.test(input);
      // If no year is specified, append the current year
      const processedInput = hasYear ? input : `${input} ${new Date().getFullYear()}`;

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              "You are a calendar assistant that returns json objects in response to a natural language prompt that follows the following format: '{timestamp: [date and time (UK time zone) of the calendar item], title: [Title of the calendar item]}'",
          },
          {
            role: 'user',
            content: processedInput,
          },
        ],
      });

      // Extract the response content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the JSON response
      // The response might be wrapped in ```json or ``` blocks, so we need to extract the JSON part
      const jsonMatch = content.match(/\{.*\}/s);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      return {
        timestamp: parsedResponse.timestamp ?? null,
        title: parsedResponse.title ?? null,
      } as ProcessedScheduleItem;
    } catch (error: any) {
      console.error('[processScheduleItem.server] Error:', error);
      throw new Error('Failed to process schedule item: ' + (error.message || error));
    }
  });
