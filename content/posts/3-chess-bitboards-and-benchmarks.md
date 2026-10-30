Perhaps the very first "proper" piece of software I wrote was a chess engine for one of my university
courses, back in 2024. I was quite proud of it, and much of what I learnt while building it has carried
me throughout my degree.

I was a bit bored a few weeks ago and, not wanting to prepare for my exams, I decided that now was probably
a good time to jog old memories. Primarily, I was just curious to see what I've learnt in the past years
and how it would shape my decisions if I were to start over. It would also help me understand how far
I had come, and potentially expose more flaws in my thinking (it did). In summary, I ended up rewriting
the entire engine.

The old engine needed 24 seconds to choose a move at depth 3. The new one reaches depth 10 in 11 milliseconds.
Between those two numbers sit a benchmark harness, multiple measured steps, a neural network trained on 38.7
million positions, matches against Stockfish, a bot on Lichess, and a long list of ideas that did not work.

You can play against it [here](/meridian/).

## Priors

Before I can even begin to explain the series of terrible decisions I made back then, I think I should
still pay some tribute.

I named the first engine Horizon (after the horizon effect) and its last release,
[v5.2.3](https://github.com/syedtaha22/Chess-v5.0/releases/tag/v5.2.3), should still be playable on
Windows. I wrote it as a desktop chess app, with a built-in engine, written in C++, with
[raylib](https://www.raylib.com) for the window, pieces, and sounds. This was the first mistake.
My initial goal was to build a chess engine. I ended up with a chess app.

The release notes said:

> In case you're able to run the engine at higher depth (depths > 5), do let me know.

I meant it as a polite request (I blamed the slow performance on my laptop...).

Anyway, going over the code again made things very obvious. A class called `GameModes` owned a `GraphicalBoard`,
a `ChessBoard` and the engine. The `ChessBoard` held 64 pointers to pieces, and every piece carried its own
texture and screen rectangle. The window drew the board it was given, and the engine searched on a copy of it.

![On the left, the old program as one nested structure. A box called GameModes holds three parts: GraphicalBoard, ChessEngine and ChessBoard. The ChessBoard box holds 64 ChessPiece objects, each with a texture and a screen rectangle. Arrows lead from the GraphicalBoard and from the ChessEngine to the ChessBoard. On the right, the new design: an engine library with tests, a UCI program and an HTTP server under it, and a web board under the server.](/images/chess/architecture.svg)

The problems fell into four groups:

- **Search:** it played well only as Black, scored every checkmate the same and never detected stalemate.
- **Rules:** castling stayed legal after a rook had moved away and back.
- **Memory:** every node copied 64 heap objects and leaked captured pieces, so a game of 40 moves reached 1GB.
- **Threading:** making a move in the search set screen positions, and the engine thread was a loop that never
  slept and shared the board with the UI thread without a lock.

## Baseline

I benchmarked this original engine by creating a small adapter that compiles the code against a
stand-in `raylib.h` (with empty functions), and wrote a simple benchmark harness that it (and future
improvements) could be tested against. The harness included 15 positions (searched to a fixed depth)
and perft, which counts all the move sequences of a given length from a position[^1]. Correct counts
are published for well-known positions[^2].

| Depth | Time per move | Positions searched |
|:--|--:|--:|
| 1 | 10ms | 1,034 |
| 2 | 357ms | 6,993 |
| 3 | 24,379ms | 159,004 |

At depth 3 it took 24 seconds on average, and at depth 4 I stopped waiting. Perft ran at about 70 thousand
positions per second, and only 13 of 24 perft runs gave the correct count due to bugs in castling and promotion.

## Optimisations

The baseline shows where the time goes. The board is 64 objects on the heap, and every node of the search
copies them and leaks the captured ones. A move passes through string parsing and sets screen positions on
the way. The search shuffles its moves and tests for checkmate at every node, and with no move ordering and
no pruning it looks at nearly every move of the tree: 159,004 positions at depth 3.

Chess programmers have well-known answers to each of these. They fall into three groups: how the board is
represented, how the search chooses what to look at, and how a position is evaluated. A benchmark says what a
change costs, and a match says whether the engine plays better, and the two can disagree, so every technique
gets both. A match is 200 games or more from random openings, with the colours swapped, at 50ms per move, and
its score gives a rating difference through the logistic model of Elo[^3].

- **Bitboards.** A bitboard is a 64-bit integer with one bit per square: one integer holds all the white
  pawns, another all the black knights, and so on. The questions that a move generator asks all the time
  ("which squares does this pawn attack?", "is this square occupied?") become a shift and an AND[^4]. A
  position can then be a small struct, and making a move copies it and changes the copy, so nothing has to be
  undone or freed. The search itself is plain negamax alpha-beta[^5].
- **Magic bitboards.** A rook, bishop or queen attacks along lines until a piece blocks the line, so the
  attacked squares depend on the pieces in the way. Walking each line takes a loop, and a magic bitboard
  replaces the loop with one multiplication and one table read[^6].

  ![Two boards with a rook on d4 and four blocking pieces. The left board shows the blockers, the right board highlights the squares the rook attacks, stopping at each blocker.](/images/chess/rays.svg)

  ```cpp
  // the squares a rook attacks, given all the occupied squares
  const Magic &m = rook_magics[square];
  return m.attacks[((occupied & m.mask) * m.magic) >> m.shift];
  ```

- **Move ordering.** Alpha-beta prunes more when the best move is searched first, and with a perfect order it
  searches about the square root of what plain minimax needs. The cheapest good ordering tries captures first,
  the most valuable victim taken by the least valuable attacker[^7], and then promotions.
- **A transposition table.** Different move orders can reach the same position, so a hash table keyed by a
  Zobrist hash can store a result and reuse it[^8][^9]. It pays when it is reused, across the passes of
  iterative deepening and across the moves of a game.
- **Quiescence search.** A search to a fixed depth stops wherever the depth runs out, even in the middle of an
  exchange, and may conclude that a pawn was won when the opponent's next move captures the queen. This is the
  horizon effect[^10]. Quiescence search fixes it by continuing with captures only, until the position is
  quiet[^11].

  ![Two small trees. On the left the search stops after the capture and scores it plus one. On the right the search continues through the recapture and scores minus eight.](/images/chess/horizon.svg)

- **Iterative deepening and PVS.** Iterative deepening searches depth 1, then 2, then 3, and so on. Each pass
  orders the moves by the result of the one before, and a move is always ready when the clock runs out[^12].
  Principal variation search (PVS) assumes that the first move is the best, searches it with a full window and
  every other move with a zero window, and searches again only when one of them turns out to be better[^13].
- **Pruning and reductions.** Null move pruning passes the turn and cuts the branch if the position is still
  good enough[^14]. Late move reductions search the moves that come late in the order to a smaller
  depth[^15]. Killer moves and the history heuristic remember which quiet moves caused cutoffs, so that they
  are tried early[^16][^17], and a check extension searches one ply deeper when the side to move is in check.

The literature has many more techniques than these. Each one became a switch in the search options and had to
pass the same gate: it had to solve all 1,404 mate puzzles, and then win a match against the engine without
it, with a sequential test[^18] that stops as soon as it can tell whether the change is at least 10 Elo
better.

![A flow of five boxes: a change, the 1,404 mate puzzles, nodes at a fixed depth, a match with a sequential test, and kept or dropped.](/images/chess/pipeline.svg)

- **Exchange evaluation** plays out the captures on one square, so that quiescence skips a capture that loses
  material[^19].
- **Losing captures last** tries the captures that lose material after the quiet moves.
- **Futility pruning** skips a quiet move near the leaves that cannot raise alpha[^20], and **reverse futility
  pruning** cuts a position near the leaves whose static score is already far above beta[^21].
- **Razoring** sends a shallow position that is far below alpha straight to quiescence, and **delta pruning**
  skips a capture in quiescence that cannot reach alpha even with a margin.
- **Late move pruning** skips the last quiet moves of a shallow position, **internal iterative reduction**
  searches a position with no table move to a smaller depth, and **singular extensions** search the table move
  deeper when every other move is much worse.
- **A logarithmic reduction table** and **a null move reduction by margin** decide how much a reduction
  takes.
- **Aspiration windows** start each pass in a window around the score of the pass before it[^22], and
  **counter moves** order a quiet move by the move that came before it.

## Results

Each engine in the table adds one idea to the engine before it.

| | Improvement |
|:--|:--|
| 00 | The original desktop engine |
| 01 | Bitboards, copy-make, legal moves, plain alpha-beta, rays for sliding pieces |
| 02 | Magic bitboards for sliding pieces |
| 03 | Move ordering: captures by victim and attacker, then promotions |
| 04 | A transposition table |
| 05 | Quiescence search |
| 06 | Iterative deepening and principal variation search |
| 07 | Null move pruning, late move reductions, killers, history, check extension |
| 08 | Exchange evaluation, futility pruning, aspiration windows, counter moves |

- **Bitboards.** At depth 3, engine 01 took 0.82ms against 24,379ms, which is 29,560 times faster. The factor
  has two sources: 27 times fewer positions (5,849 against 159,004, because the old search shuffled its moves
  and tested for checkmate at every node), and about 1,000 times faster per position, from no memory
  allocation, string parsing or UI calls.
- **Magic bitboards.** One lookup is 26 to 29 times faster than walking the rays, but the whole search is
  only 1.3 to 1.4 times faster, because attacks are one part of the work and the rest did not change
  (Amdahl's Law)[^23]. Perft shows the two steps in one number: 70 thousand positions per second for the old
  generator, 27.8 million for bitboards with rays and 44.2 million with magic lookups, with all six positions
  counted correctly from engine 01 on.
- **Move ordering.** At depth 6 it cut the node count from 10,959,617 to 178,062 and the time from 1,150ms to
  29ms. It was the largest gain after the first change, and it is a small change to the code.
- **Quiescence search.** It is 1.7 to 4 times slower at equal depth, but it won 92% of the points against the
  engine without it (180 wins, 8 draws, 12 losses).
- **Iterative deepening and principal variation search.** Together they are 1.4 to 3.3 times faster and won
  59% of the points (98 wins, 39 draws, 63 losses).
- **Pruning and reductions.** They are 1.5 to 4.6 times faster and won 75% of the points (135 wins, 29 draws,
  36 losses). Engine 07 reaches depth 10 in 80ms, where engine 06 needs 5,306ms.

These are the verdicts of the techniques, each against the engine without it. The chart has every change that was tried, and the table the 13 search changes.

![A chart of the score of each change. Reverse futility pruning scores 0.582, futility 0.552, counter moves 0.535, losing captures late 0.530 and aspiration windows 0.523. Late move pruning scores 0.425.](/images/chess/verdicts.svg)

| Change                            | Games | Score |     Verdict | Nodes | Kept |
|:----------------------------------|------:|------:|------------:|------:|-----:|
| Exchange evaluation of captures   |  1172 | 0.537 |      better |  0.75 |  yes |
| Delta pruning                     |  1934 | 0.491 |  not better |  0.86 |   no |
| Losing captures after quiet moves |  1452 | 0.530 |      better |  1.14 |  yes |
| Reverse futility pruning          |   390 | 0.582 |      better |  0.37 |  yes |
| Futility pruning                  |   640 | 0.552 |      better |  0.55 |  yes |
| Razoring                          |  3000 | 0.504 | no decision |  0.97 |   no |
| Late move pruning                 |   348 | 0.425 |  not better |  0.84 |   no |
| Logarithmic reduction table       |  3000 | 0.511 | no decision |  1.19 |   no |
| Internal iterative reduction      |  3000 | 0.500 | no decision |  1.00 |   no |
| Null move reduction by margin     |  3000 | 0.506 | no decision |  0.83 |  yes |
| Aspiration windows                |  1996 | 0.523 |      better |  1.12 |  yes |
| Singular extensions               |  3000 | 0.514 | no decision |  1.00 |   no |
| Counter moves, continuation score |  1078 | 0.535 |      better |  0.97 |  yes |

Seven of the 13 were kept. Reverse futility pruning was the largest, with 0.582 in only 390 games and 63%
fewer positions, and futility pruning scored 0.552 with 45% fewer. Delta pruning searched 14% fewer positions
and did not play better, while aspiration windows search more and win more games. Positions per move are a
cost, and they are not the quantity that wins. With the kept changes, engine 08 reaches depth 10 in 17ms,
against 80ms for engine 07, and won 72% of the points against it (252 wins, 74 draws, 74 losses).

## Evaluation and tuning

### Tuning

So far, I had not touched the evaluation, and it was still what I started with: material and one table of
bonuses for each piece, copied from the chess programming wiki[^24]. A quick method of improving the evaluation
is to tune its parameters (the piece values and the tables of bonuses) on self-play games[^25]. This is done by
letting the engine play against itself, keeping the quiet positions of its games, and labelling each one with
the result of its game. A tuner then changes one number by one point, keeps the change if the error falls, and
repeats until nothing helps.

I let the engine play 24,000 games against itself and kept every third quiet position, 695,000 in all. Tuning
the tables alone scored 0.626 against the old numbers in 254 games, about 90 Elo. The tuned evaluation costs 133ns per position against 62ns and scored 65% of the points (236 wins, 49
draws, 115 losses). The engine with the tuned evaluation is engine 09.

### Neural Networks

Modern chess engines rarely rely on a hand-written or tuned evaluation anymore. Instead they have moved to
efficiently updatable neural networks (NNUE)[^26] or other deep-learning based approaches[^27]. I took the
NNUE route. The engine with the network is engine 10.

![The first network, drawn as layers of nodes and connections. On the left are the inputs for each side, 768 each, connected to 128 values for each side in the first layer. Both groups of 128 connect to a single node of the output layer, and that node gives the score.](/images/chess/network-architecture.svg)

The network has an input for every combination of a piece and a square, 768 in all, and a position switches on
at most 32 of them. The first layer, 128 numbers for each side, is therefore a sum of at most 32 rows of
weights, and when a move is made one row comes out and another goes in. That is what makes it cheap enough for
millions of evaluations per second. The weights are 16-bit integers, and training is in floating point.

The training data came from two sources: the engine itself, and published games of Leela Chess Zero[^28].
Self-play games gave each quiet position with the score of a search and the result of its game. After three
rounds, each trained on the games of the network before it, the network scored 82% of the points against the
tuned engine, about 270 Elo from one change. Leela's games come with the evaluation of a far deeper
search. A network trained on those alone was about 180 Elo weaker than one trained on self-play games.

![A dot plot with an interval for each trained network, in four groups: training data, size and structure, heavier evaluation, and loss and data. Most dots lie between 0 and +120 Elo. A network with Leela positions only is at -180, a network with 512 values per side at -37, and a network with a second layer at -64. The best network is marked in red at +109.](/images/chess/network-experiments.svg)

A recipe that trains a network in 6 minutes and a test of 300 games make questions cheap, so I asked a lot of
them. Letting the number of pieces choose one of eight output layers scored +97. Giving the network
the half of the board that holds the king, with a mirror of the files, scored +109, the best of these (the
red dot), while eight king buckets had too many inputs for the data and lost strength. A second layer and
threat inputs lowered the error, but slowed the engine so much that the strength did not follow. Across the 18
stronger networks a lower error went with more Elo only loosely, a correlation of about -0.6.

The chart below shows the time per move for each engine, at depths 3 and 6,

![Two panels of vertical bars on a logarithmic axis, with the ids 00 to 10 on the horizontal axis. At depth 3 the original engine is 24,379ms and every new engine is under 1ms. At depth 6 the engine with bitboards takes 1,609ms and the final engine takes 0.93ms.](/images/chess/time-per-move.svg)

and this one shows the number of positions searched at each depth. The plain search grows by a factor of 10
to 16 for each ply, which is the effective branching factor, and each improvement lowers it.

![A logarithmic chart of positions searched at each depth for seven engines, 01, 03, 05, 07, 08, 09 and 10. The engine with bitboards reaches ten million at depth 6. The others are lower. Engine 07 reaches 400 thousand at depth 10, and engines 08, 09 and 10 stay between 45 and 62 thousand.](/images/chess/nodes-by-depth.svg)

## Hardware optimisations

A few ideas that can make a fast program faster, rely on taking the hardware it runs on into account. The
search ran at about 3.9 million positions per second on one core, and none of the three below changes a node
count.

- **Prefetching.** The transposition table is far larger than the processor's cache, so reading an entry
  stalls the processor. The program asks for the entry as soon as a move is made, and the memory is on its way
  while the rest of the work is done. It was 3% faster at a table of 16MB.
- **SIMD with a choice at start.** The network sums rows of 16-bit weights, and AVX2 adds 16 of them at a
  time. The program has two versions of these functions, one for AVX2 and one for the base instruction set,
  and chooses between them when it starts, so a release binary does not have to guess the processor of its
  user. With the prefetch it was 12% faster.
- **Compiler flags.** Building with `-mpopcnt -mbmi2` lets the slider lookup use the PEXT instruction of the
  processor in place of the multiplication of a magic number[^29], which searches 5% to 12% more positions per
  second. It is a build option, because a processor without BMI2 cannot run the binary.

## Strength

### Against Stockfish

I played the engines against Stockfish 19, limited in strength with its `UCI_LimitStrength` and `UCI_Elo`
options, 50 games at each level, and fitted a rating to the scores of each engine.

![A horizontal axis of Elo from 400 to 3200 with intervals: the old engine at depth 3 near 1132, the engine with bitboards at depths 1 to 3 from 584 to 1213, the engine with pruning at 1000ms near 2307, the engine with refinements at 1000ms near 2444, the engine with the tuned evaluation at 1000ms near 2602, and the engine with the network near 2931.](/images/chess/rating.svg)

| Player | Rating | 95% interval |
|:--|--:|:--|
| 00, depth 3 | 1132 | 1044 to 1220 |
| 01, depth 3 | 1213 | 1143 to 1284 |
| 07, 1000ms per move | 2307 | 2270 to 2345 |
| 08, 1000ms per move | 2444 | 2406 to 2481 |
| 09, 1000ms per move | 2602 | 2564 to 2640 |
| 10, 1000ms per move | 2931 | 2876 to 2986 |

The old engine at depth 3 rates about the same as my plain new search at depth 3. The new code did not make
depth 3 better. It made depth 3 take 0.8ms instead of 24 seconds, and that opened the door to depth 10. The
scale is Stockfish's `UCI_Elo`, which is calibrated for long time controls and ends at 3190, so 2931 is not a
rating-list rating, and a rating near the top of the scale is the least certain.

Per position my engine is faster than Stockfish, 4.2 million per second against 0.6 to 1.6 million per core,
but Stockfish reaches depth 10 about 4.4 times sooner because it needs 2,300 positions where I need 45,163. I
made each position cheap, and the strong engines make most positions unnecessary. The last aim of the
ideation document, to beat Stockfish, turned out to be possible up to a point. Horizon rated 1132 on this
scale at depth 3, and the final engine scores 95% against Stockfish limited to 2400, 71% at 2800 and 18% at
3190.

### Puzzles as a second ruler

A match gives a wide interval from a few hundred games, so I wanted a cheaper ruler. The Lichess puzzle
database has about 6.2 million puzzles. The engine plays the moves of the solver from an empty table, and a
puzzle is solved when every move is right. A move is right when it is the solution move or any other move that
gives checkmate.

| Engine                           | Depth 4 | 20,000 nodes | 50ms per move |
|:---------------------------------|--------:|-------------:|--------------:|
| 01 Plain alpha-beta              |   66.7% |              |               |
| 03 Move ordering                 |   66.7% |              |               |
| 05 Quiescence search             |   80.8% |              |               |
| 07 Pruning and reductions        |   84.3% |        86.5% |         91.8% |
| 09 Tuned evaluation              |   84.5% |        89.7% |         93.5% |
| 10 Network                       |   88.2% |        93.4% |         96.2% |

## Meridian v1.0.0

The final engine (after more training) is released as Meridian 1.0.0. Against engine 10, it scored:

| Time per move | Games | Score | Elo |
|--:|--:|--:|:--|
| 50ms | 800 | 484 wins, 121 draws, 195 losses | +131 (+106 to +158) |
| 200ms | 400 | 244 wins, 78 draws, 78 losses | +153 (+117 to +193) |
| 1000ms | 112 | 76 wins, 20 draws, 16 losses | +208 (+139 to +296) |

The gain grows with the time, as one would expect from a better evaluation and a faster search together.

## Takeaways

Comparing the two engines, what stands out is the assumption behind the first one. I put usability and
readability first without understanding what I was trading them for, and I wanted strength without knowing
that speed is what drives it. A plain minimax search with unlimited time would reach the same or better
conclusions, but nobody has unlimited time, so speed matters, and speed alone is not enough either. It has to
come with a search that looks only at what is needed, and that has to be built into the engine. The original
project also taught me to learn on my own, alongside my coursework, and not only from what is taught, though I
could not apply that to the project then, and this rewrite is probably my remedy for it.

## Goal 8

The goal of building the best chess engine in existence still stands, but I no longer expect to reach it in
one jump. The engine now plays on [Lichess](https://lichess.org/@/ce_meridian), and a framework for evaluating
and improving it continuously has been written ([meristats](/meristats)). The
path from here is more structured: first beyond 3000 Elo, then the Top Chess Engine Championship
([TCEC](https://tcec-chess.com)). Underneath it all, is the same endless, unending pursuit of knowledge.

The source code can be found at [https://github.com/syedtaha22/meridian](https://github.com/syedtaha22/meridian).

[^1]: *Perft*. <https://www.chessprogramming.org/Perft>
[^2]: *Perft Results*. <https://www.chessprogramming.org/Perft_Results>
[^3]: *Match Statistics*. <https://www.chessprogramming.org/Match_Statistics>
[^4]: *Bitboards*. <https://www.chessprogramming.org/Bitboards>
[^5]: *Alpha-Beta*. <https://www.chessprogramming.org/Alpha-Beta>
[^6]: *Magic Bitboards*. <https://www.chessprogramming.org/Magic_Bitboards>
[^7]: *MVV-LVA*. <https://www.chessprogramming.org/MVV-LVA>
[^8]: *Transposition Table*. <https://www.chessprogramming.org/Transposition_Table>
[^9]: *Zobrist Hashing*. <https://www.chessprogramming.org/Zobrist_Hashing>
[^10]: *Horizon Effect*. <https://www.chessprogramming.org/Horizon_Effect>
[^11]: *Quiescence Search*. <https://www.chessprogramming.org/Quiescence_Search>
[^12]: *Iterative Deepening*. <https://www.chessprogramming.org/Iterative_Deepening>
[^13]: *Principal Variation Search*. <https://www.chessprogramming.org/Principal_Variation_Search>
[^14]: *Null Move Pruning*. <https://www.chessprogramming.org/Null_Move_Pruning>
[^15]: *Late Move Reductions*. <https://www.chessprogramming.org/Late_Move_Reductions>
[^16]: *Killer Heuristic*. <https://www.chessprogramming.org/Killer_Heuristic>
[^17]: *History Heuristic*. <https://www.chessprogramming.org/History_Heuristic>
[^18]: *Sequential Probability Ratio Test*. <https://www.chessprogramming.org/Sequential_Probability_Ratio_Test>
[^19]: *Static Exchange Evaluation*. <https://www.chessprogramming.org/Static_Exchange_Evaluation>
[^20]: *Futility Pruning*. <https://www.chessprogramming.org/Futility_Pruning>
[^21]: *Reverse Futility Pruning*. <https://www.chessprogramming.org/Reverse_Futility_Pruning>
[^22]: *Aspiration Windows*. <https://www.chessprogramming.org/Aspiration_Windows>
[^23]: *Amdahl's Law*. <https://en.wikipedia.org/wiki/Amdahl%27s_law>
[^24]: *Simplified Evaluation Function*. <https://www.chessprogramming.org/Simplified_Evaluation_Function>
[^25]: *Texel's Tuning Method*. <https://www.chessprogramming.org/Texel%27s_Tuning_Method>
[^26]: *NNUE*. <https://www.chessprogramming.org/NNUE>
[^27]: *Leela Chess Zero*. <https://lczero.org>
[^28]: *Leela Chess Zero training data*. <https://lczero.org/dev/wiki/training-data/>
[^29]: *BMI2*. <https://www.chessprogramming.org/BMI2>
