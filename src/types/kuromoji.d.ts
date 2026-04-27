declare module 'kuromoji' {
  interface Token {
    surface_form: string
    pos: string
    pos_detail_1: string
    pos_detail_2: string
    pos_detail_3: string
    conjugated_type: string
    conjugated_form: string
    basic_form: string
    reading: string
    pronunciation: string
    word_id: number
    word_type: string
    word_position: number
  }

  interface Tokenizer {
    tokenize(text: string): Token[]
  }

  interface Builder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void
  }

  interface KuromojiModule {
    builder(options: { dicPath: string }): Builder
  }

  const kuromoji: KuromojiModule
  export default kuromoji
}
