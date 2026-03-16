import { z } from "zod";
import { debug } from "../constants";

/**
 * Ad Definition type
 * Represents a data contract + behavior for an ad type
 */
export type AdDefinition<
  TData extends z.ZodTypeAny,
  TMetadata extends z.ZodTypeAny | undefined = undefined,
> = {
  /**
   * The literal type string for this ad (e.g., "cast", "link")
   */
  type: string;

  /**
   * The Zod schema for the ad's data field
   */
  data: TData;

  /**
   * Optional Zod schema for the ad's metadata field
   */
  metadata?: TMetadata;

  /**
   * Optional verification function that runs after parsing
   * Receives already-validated data
   */
  verify?: (data: z.infer<TData>) => Promise<void>;

  /**
   * Optional metadata enrichment function
   * Only available if metadata schema is defined
   */
  getMetadata?: (
    data: z.infer<TData>,
  ) => Promise<TMetadata extends z.ZodTypeAny ? z.infer<TMetadata> : never>;
};

/**
 * Typed helper to define an ad
 * Locks type inference and prevents widening
 * Adds a `process` method for convenience
 * @param def - Ad definition object
 * @returns The same definition with proper types and a process method
 */
export function defineAd<
  const TData extends z.ZodTypeAny,
  const TMetadata extends z.ZodTypeAny | undefined,
>(
  def: AdDefinition<TData, TMetadata>,
): AdDefinition<TData, TMetadata> & {
  /**
   * Process this ad through the full pipeline: parse → verify → getMetadata
   * @param input - Raw input data to process
   * @returns Processed data and optional metadata
   */
  process: (input: z.infer<TData>) => Promise<{
    data: z.infer<TData>;
    metadata: TMetadata extends z.ZodTypeAny
      ? TMetadata extends undefined
        ? undefined
        : z.infer<TMetadata> | undefined
      : undefined;
  }>;
  /**
   * Safe version of process that returns a result object
   * @param input - Raw input data to process
   * @returns Result object with success flag and data or error
   */
  safeProcess: (input: z.infer<TData>) => Promise<{
    success: boolean;
    data?: z.infer<TData>;
    metadata?: TMetadata extends z.ZodTypeAny
      ? TMetadata extends undefined
        ? undefined
        : z.infer<TMetadata> | undefined
      : undefined;
    error?: z.ZodError | string;
  }>;
} {
  return {
    ...def,
    process: (input: z.infer<TData>) => processAd(def, input),
    safeProcess: (input: z.infer<TData>) => safeProcessAd(def, input),
  };
}

/**
 * Process an ad through the full pipeline: parse → verify → getMetadata
 * @param ad - Ad definition
 * @param input - Raw input data to process
 * @returns Processed data and optional metadata
 */
export async function processAd<
  TData extends z.ZodTypeAny,
  TMetadata extends z.ZodTypeAny | undefined,
>(
  ad: AdDefinition<TData, TMetadata>,
  input: z.infer<TData>,
): Promise<{
  data: z.infer<TData>;
  metadata: TMetadata extends z.ZodTypeAny
    ? TMetadata extends undefined
      ? undefined
      : z.infer<TMetadata> | undefined
    : undefined;
}> {
  if (debug) {
    console.log("processAd:input", input);
  }
  // Parse and validate
  const data: z.infer<TData> = ad.data.parse(input);

  if (debug) {
    console.log("processAd:data", data);
  }

  // Verify if function is provided
  if (ad.verify) {
    await ad.verify(input);
  }

  // Get metadata if function and schema are provided
  const metadata =
    ad.getMetadata && ad.metadata ? await ad.getMetadata(data) : undefined;

  return { data, metadata, type: ad.type } as {
    type: string;
    data: z.infer<TData>;
    metadata: TMetadata extends z.ZodTypeAny
      ? TMetadata extends undefined
        ? undefined
        : z.infer<TMetadata> | undefined
      : undefined;
  };
}

/**
 * Safe version of processAd that returns a result object
 * @param ad - Ad definition
 * @param input - Raw input data to process
 * @returns Result object with success flag and data or error
 */
export async function safeProcessAd<
  TData extends z.ZodTypeAny,
  TMetadata extends z.ZodTypeAny | undefined,
>(
  ad: AdDefinition<TData, TMetadata>,
  input: unknown,
): Promise<{
  success: boolean;
  data?: z.infer<TData>;
  metadata?: TMetadata extends z.ZodTypeAny
    ? TMetadata extends undefined
      ? undefined
      : z.infer<TMetadata> | undefined
    : undefined;
  error?: z.ZodError | string;
}> {
  // Safe parse
  const parseResult = ad.data.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    };
  }

  const data: z.infer<TData> = parseResult.data;

  // Verify if function is provided
  if (ad.verify) {
    try {
      await ad.verify(data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  // Get metadata if function and schema are provided
  const metadata =
    ad.getMetadata && ad.metadata ? await ad.getMetadata(data) : undefined;

  return {
    success: true,
    data,
    metadata,
  } as {
    success: boolean;
    data?: z.infer<TData>;
    metadata?: TMetadata extends z.ZodTypeAny
      ? TMetadata extends undefined
        ? undefined
        : z.infer<TMetadata> | undefined
      : undefined;
    error?: z.ZodError | string;
  };
}
