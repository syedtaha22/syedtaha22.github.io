Meridian started as a desktop game I wrote in C++ and was rewritten as a library that does one
thing: it takes a position and answers with a move. The board is held as 64-bit bitboards, one
bit per square for each kind of piece, so the legal moves of a side come out of a few shifts and
table lookups.[^1] Sliding pieces use magic bitboards, which turn the question of which squares a
rook can reach past the pieces in its way into one multiplication and one array read.[^2]

To choose a move it searches the tree of continuations with alpha-beta pruning,[^3][^4] which drops
any line a player would never allow. Moves are tried most promising first:[^5] the hash move,[^6]
then captures by the value of the victim,[^7] then the quiet moves that caused cutoffs before.[^8][^9]
Positions already seen are recognised by a Zobrist hash.[^10][^11] Captures are played out at the
horizon, so the search does not stop in the middle of an exchange,[^12] and it deepens one ply at
a time, so a move is always ready when the clock runs out.[^13] Lines that are already good
enough are cut short with a null move test,[^14] and late quiet moves are searched less deeply.[^15]
A position is scored by material, by where each piece stands,[^16] and by a few more terms, with
the numbers fitted to the results of games the engine played against itself.[^19]

The settings panel controls the search directly. **Search depth** is the most plies it looks
ahead, **time limit** is the most it may think about one move, **move hints** marks the squares
the piece you picked up can reach, and **AI hints** draws an arrow for the move the engine would
play in your place. The charts under the board show how long each search took and how the engine
rated the position after each of its moves.

Against the engine before its evaluation was tuned, the finished engine scored 65% over 400
games at 50 milliseconds per move. Against Stockfish 19 held to a chosen playing strength, at one
second per move, it plays at about 2600 on Stockfish's own scale over 600 games.[^17] The source,
the tests and every recorded benchmark step are in the repository.[^18]

[^1]: *Bitboards*. <https://www.chessprogramming.org/Bitboards>
[^2]: *Magic Bitboards*. <https://www.chessprogramming.org/Magic_Bitboards>
[^3]: Knuth, D. E., et al. (1975). An analysis of alpha-beta pruning. *Artificial Intelligence*.
    <https://doi.org/10.1016/0004-3702(75)90019-3>
[^4]: *Alpha-Beta*. <https://www.chessprogramming.org/Alpha-Beta>
[^5]: *Move Ordering*. <https://www.chessprogramming.org/Move_Ordering>
[^6]: *Transposition Table* (the hash move). <https://www.chessprogramming.org/Transposition_Table>
[^7]: *MVV-LVA*. <https://www.chessprogramming.org/MVV-LVA>
[^8]: *Killer Heuristic*. <https://www.chessprogramming.org/Killer_Heuristic>
[^9]: *History Heuristic*. <https://www.chessprogramming.org/History_Heuristic>
[^10]: Zobrist, A. L. (1970). *A new hashing method with application for game playing*.
    <http://digital.library.wisc.edu/1793/57624>
[^11]: *Zobrist Hashing*. <https://www.chessprogramming.org/Zobrist_Hashing>
[^12]: *Quiescence Search*. <https://www.chessprogramming.org/Quiescence_Search>
[^13]: *Iterative Deepening*. <https://www.chessprogramming.org/Iterative_Deepening>
[^14]: *Null Move Pruning*. <https://www.chessprogramming.org/Null_Move_Pruning>
[^15]: *Late Move Reductions*. <https://www.chessprogramming.org/Late_Move_Reductions>
[^16]: *Piece-Square Tables*. <https://www.chessprogramming.org/Piece-Square_Tables>
[^17]: Stockfish developers. *Stockfish*. <https://stockfishchess.org>
[^18]: Taha, S. *chess* [Source code]. GitHub. <https://github.com/syedtaha22/chess>
[^19]: *Texel's Tuning Method*. <https://www.chessprogramming.org/Texel%27s_Tuning_Method>
