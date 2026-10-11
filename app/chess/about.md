The engine started as a desktop game I wrote in C++ and was rewritten as a library that does one
thing: it takes a position and answers with a move. The board is held as 64-bit bitboards, one
bit per square for each kind of piece, so the legal moves of a side come out of a few shifts and
table lookups. Sliding pieces use magic bitboards, which turn the question of which squares a
rook can reach past the pieces in its way into one multiplication and one array read.[^1]

To choose a move it searches the tree of continuations with alpha-beta pruning,[^2] which drops
any line a player would never allow. Moves are tried most promising first: the hash move, then
captures by the value of the victim, then the quiet moves that caused cutoffs before. Positions
already seen are recognised by a Zobrist hash.[^3] Captures are played out at the horizon, so the
search does not stop in the middle of an exchange, and it deepens one ply at a time, so a move is
always ready when the clock runs out. Lines that are already good enough are cut short with a
null move test, and late quiet moves are searched less deeply.[^1] A position is scored by
material and by where each piece stands, using piece-square tables.

The settings panel controls the search directly. **Search depth** is the most plies it looks
ahead, **time limit** is the most it may think about one move, **move hints** marks the squares
the piece you picked up can reach, and **AI hints** draws an arrow for the move the engine would
play in your place. The charts under the board show how long each search took and how the engine
rated the position after each of its moves.

Against the plain fixed-depth search it grew out of, the finished engine scored 96.3% over 200
games at 50 milliseconds per move. Against Stockfish 19 held to a chosen playing strength, at one
second per move, it plays at about 2300 on Stockfish's own scale over 600 games.[^4] The source,
the tests and every recorded benchmark step are in the repository.[^5]

[^1]: Chess Programming Wiki. Bitboards, magic bitboards, null move pruning and late move reductions.
    <https://www.chessprogramming.org>
[^2]: Knuth, D. E., & Moore, R. W. (1975). An analysis of alpha-beta pruning. *Artificial
    Intelligence*, 6(4), 293-326. <https://doi.org/10.1016/0004-3702(75)90019-3>
[^3]: Zobrist, A. L. (1970). *A new hashing method with application for game playing* (Technical
    Report 88). Computer Sciences Department, University of Wisconsin.
    <http://digital.library.wisc.edu/1793/57624>
[^4]: Stockfish developers. *Stockfish* [Source code]. The strength is set with the UCI options
    `UCI_LimitStrength` and `UCI_Elo`. <https://stockfishchess.org>
[^5]: Taha, S. *chess* [Source code]. GitHub. <https://github.com/syedtaha22/chess>
