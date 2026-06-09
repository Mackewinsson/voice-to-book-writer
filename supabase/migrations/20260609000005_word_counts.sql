-- Create an immutable function to count words accurately
CREATE OR REPLACE FUNCTION count_words(text_val text) RETURNS integer AS $$
BEGIN
  -- Returns 0 if text is null or empty, otherwise counts non-whitespace sequences
  IF text_val IS NULL OR trim(text_val) = '' THEN
    RETURN 0;
  END IF;
  RETURN (SELECT count(*) FROM regexp_matches(text_val, '\S+', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RPC to get word count for all books of a specific user
CREATE OR REPLACE FUNCTION get_book_word_counts(user_uuid text)
RETURNS TABLE (book_id uuid, word_count bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT b.id, COALESCE(SUM(count_words(bl.content)), 0)
  FROM books b
  LEFT JOIN chapters c ON b.id = c.book_id
  LEFT JOIN blocks bl ON c.id = bl.chapter_id
  WHERE b.user_id = user_uuid
  GROUP BY b.id;
$$;

-- RPC to get word count for all chapters of a specific book
CREATE OR REPLACE FUNCTION get_chapter_word_counts(book_uuid uuid)
RETURNS TABLE (chapter_id uuid, word_count bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT c.id, COALESCE(SUM(count_words(bl.content)), 0)
  FROM chapters c
  LEFT JOIN blocks bl ON c.id = bl.chapter_id
  WHERE c.book_id = book_uuid
  GROUP BY c.id;
$$;
