/**
 * Reading time of a post, estimated from its Markdown.
 *
 * Words are read at 238 words per minute, the average silent reading rate of adults for English
 * non-fiction (Brysbaert, 2019, "How many words do we read per minute? A review and
 * meta-analysis of reading rate", Journal of Memory and Language 109). Each image adds time, as
 * on Medium: 12 seconds for the first, one second less for each one after it, and 3 seconds at
 * least. The alternative text of an image is not counted as words, since the time of the image
 * stands for it. The footnote definitions at the end are references, so they are not counted,
 * while the footnote marks in the text are. Code, table cells and list items count as words like
 * any other text.
 */

const WORDS_PER_MINUTE = 238;
const FIRST_IMAGE_SECONDS = 12;
const LAST_IMAGE_SECONDS = 3;

/**
 * Counts the words of a Markdown source and the images in it.
 */
export function measure(source: string): { words: number; images: number } {
  let text = source.replace(/\r\n/g, "\n");

  text = text.replace(/^\[\^[^\]]+\]:.*$/gm, "");

  const images = (text.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length;
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");

  text = text
    .replace(/^```.*$/gm, " ") // code fences
    .replace(/\[\^[^\]]+\]/g, " word ") // a footnote mark
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // a link keeps its text
    .replace(/<([^>\s]+)>/g, "$1") // an autolink
    .replace(/<[^>]+>/g, " ") // HTML tags
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, " ") // table separator rows
    .replace(/[|*_`#>~]/g, " "); // table bars, emphasis, headings, quotes

  // A word is a run of non-space characters that holds a letter or a digit.
  const words = text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  return { words, images };
}

/**
 * The reading time of a Markdown source in whole minutes, rounded to the nearest minute and at
 * least 1.
 */
export function estimateReadingMinutes(source: string): number {
  const { words, images } = measure(source);
  let seconds = (words / WORDS_PER_MINUTE) * 60;
  for (let i = 0; i < images; i++) {
    seconds += Math.max(FIRST_IMAGE_SECONDS - i, LAST_IMAGE_SECONDS);
  }
  return Math.max(1, Math.round(seconds / 60));
}
