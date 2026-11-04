#!/usr/bin/env python3
"""数学β版(private-math-beta.json)の正答を、解説とは独立に再計算して照合する。

使い方: python3 scripts/study/verify-math-beta.py
終了コード: 不一致・正解が複数・正解なしがあれば 1

令和7年度は公式正解表(03_2025_sugaku_seikai.pdf)の値(OFFICIAL_R7)とも突き合わせる。
令和8年度は公式正解表が未入手のため、独立計算のみ(正解表照合はできていない)。
標準ライブラリのみ使用。
"""
import json
import sys
from fractions import Fraction
from itertools import product
from math import isqrt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data/study/private-math-beta.json"

# 令和7年度 数学 公式正解表(2026-11-04に原本PDFから転記した、検証に使う分のみ)
OFFICIAL_R7 = {
    "2-1": "18",        # 大問2(1) アイ
    "2-2": "(9,2)",     # 大問2(2) ウ,エ
    "2-3": "-1/3",      # 大問2(3) y=-1/3 x + 5 の傾き(オ=-,カ=1,キ=3)
    "4-1-a": "9",       # 大問4(1) ア
    "4-2": "P[A[T[x,2],3],4]",  # 大問4(2) エ=ⓘ。原本の選択肢ⓘの式(問題冊子11ページで確認)
    "4-4": "150",       # 大問4(4) ケコサ
}


# ---- 大問4 のプログラム A/T/P ----
def A(x, n): return x + n
def T(x, n): return x * n
def P(x, n): return x ** n


def lattice_count(n):
    """頂点 (0,0),(3,0),(1,n) の三角形の内部または辺上の格子点数を全探索で数える。"""
    pts = [(0, 0), (3, 0), (1, n)]

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    cnt = 0
    for x, y in product(range(0, 4), range(0, n + 1)):
        d = [cross(pts[i], pts[(i + 1) % 3], (x, y)) for i in range(3)]
        if all(v >= 0 for v in d) or all(v <= 0 for v in d):
            cnt += 1
    return cnt


def cube_section_edges():
    """1辺2の立方体を3つの中点(AB,AD,BFの中点)を通る平面で切る。
    平面と交わる辺の数 = 切り口の多角形の頂点数(各頂点が辺上にある一般の場合)。
    座標: A=(0,2,2) B=(0,0,2) C=(2,0,2) D=(2,2,2) E=(0,2,0) F=(0,0,0) G=(2,0,0) H=(2,2,0)"""
    V = {"A": (0, 2, 2), "B": (0, 0, 2), "C": (2, 0, 2), "D": (2, 2, 2),
         "E": (0, 2, 0), "F": (0, 0, 0), "G": (2, 0, 0), "H": (2, 2, 0)}
    edges = ["AB", "BC", "CD", "DA", "EF", "FG", "GH", "HE", "AE", "BF", "CG", "DH"]
    mid = lambda p, q: tuple(Fraction(a + b, 2) for a, b in zip(V[p], V[q]))
    m1, m2, m3 = mid("A", "B"), mid("A", "D"), mid("B", "F")
    u = [m2[i] - m1[i] for i in range(3)]
    v = [m3[i] - m1[i] for i in range(3)]
    nrm = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    f = lambda p: sum(nrm[i] * (p[i] - m1[i]) for i in range(3))
    crossing = [e for e in edges if f(V[e[0]]) * f(V[e[1]]) < 0]
    on_vertex = [k for k, p in V.items() if f(p) == 0]
    return len(crossing), on_vertex  # 頂点が平面上にあれば別扱いが必要


results = []


def check(qid, computed, official=None, note="", value=None):
    """computed は表示用。official があれば value(省略時は computed)と実際に比較する。"""
    match = None
    if official is not None:
        match = str(computed if value is None else value) == official
    results.append((qid, computed, official, note, match))


def main():
    qs = {q["id"]: q for q in json.loads(DATA.read_text(encoding="utf-8"))["questions"]}
    problems = []

    def chosen(qid):
        q = qs[qid]
        return q["choices"][q["answer"]]

    def only_one_correct(qid, predicate):
        """選択肢のうち条件を満たすものがちょうど1つで、それが登録された正答か。"""
        q = qs[qid]
        # 選択肢の負号は全角「−」のため、判定前に半角へ正規化する
        ok = [i for i, c in enumerate(q["choices"]) if predicate(c.replace("−", "-"))]
        if ok != [q["answer"]]:
            problems.append(f"{qid}: 条件を満たす選択肢={ok}、登録された正答={q['answer']}")
        return ok

    # --- 令和7年度 ---
    # 大問2(1): 交点Aのx座標6、y=x^2/12 → y=3、a=6*3
    a = 6 * Fraction(6 ** 2, 12)
    only_one_correct("kosen-math-2025-b2-01", lambda c: Fraction(c) == a)
    check("kosen-math-2025-b2-01", str(a), OFFICIAL_R7["2-1"], value=chosen("kosen-math-2025-b2-01"))

    # 大問3(1)(β版の条件): 弦の比 AP:PB=2:1、AB=2*2√5。AB^2=80、(2k)^2+k^2=80
    ab2 = (2 * 2) ** 2 * 5  # (4√5)^2 = 80
    k2 = Fraction(ab2, 5)   # 5k^2 = 80 → k^2 = 16
    k = isqrt(int(k2))
    assert k * k == k2, "kが整数にならない"
    ap = 2 * k
    only_one_correct("kosen-math-2025-b3-01", lambda c: c == f"{ap}cm")
    check("kosen-math-2025-b3-01", f"AP={ap}cm", None,
          "原本の大問3(1)は『弧の比2:1で∠QBA』(正解30)。β版は弦の比に変えた別問題のため公式正解表では照合不可")

    # 大問4(1): P[-3,2]
    only_one_correct("kosen-math-2025-b4-01", lambda c: int(c) == P(-3, 2))
    check("kosen-math-2025-b4-01", str(P(-3, 2)), OFFICIAL_R7["4-1-a"], value=chosen("kosen-math-2025-b4-01").replace("−", "-"))

    # 大問2(2): x,y が1桁の整数、xy=18、x>6
    pts = [(x, 18 // x) for x in range(7, 10) if 18 % x == 0 and 18 // x < 10]
    only_one_correct("kosen-math-2025-b2-02",
                     lambda c: tuple(int(t) for t in c.strip("()").split(",")) in pts)
    check("kosen-math-2025-b2-02", "(%d,%d)" % pts[0] if len(pts) == 1 else str(pts), OFFICIAL_R7["2-2"], value=chosen("kosen-math-2025-b2-02"))

    # 大問2(3): A(6,3), B(9,2) の傾き
    slope = Fraction(2 - 3, 9 - 6)
    only_one_correct("kosen-math-2025-b2-03", lambda c: Fraction(c.replace("−", "-")) == slope)
    check("kosen-math-2025-b2-03", str(slope), OFFICIAL_R7["2-3"], value=chosen("kosen-math-2025-b2-03").replace("−", "-"))

    # 大問4(2): (2x+3)^4 になる式。各選択肢をxの複数の値で評価。
    def parse_prog(source):
        """A/T/P と x・整数・入れ子の [] だけを解釈する安全な小型パーサー。eval は使わない。"""
        import re

        tokens = []
        pos = 0
        token_re = re.compile(r"\s*(A|T|P|x|-?\d+|[\[\](),])")
        while pos < len(source):
            match = token_re.match(source, pos)
            if not match:
                raise ValueError(f"不正なプログラム表記: {source[pos:]}")
            tokens.append(match.group(1))
            pos = match.end()
        index = 0

        def take(expected=None):
            nonlocal index
            if index >= len(tokens):
                raise ValueError("プログラム式が途中で終わっています")
            token = tokens[index]
            if expected is not None and token != expected:
                raise ValueError(f"{expected} が必要ですが {token} でした")
            index += 1
            return token

        def parse_value(x_value):
            token = take()
            if token == "x":
                return x_value
            if re.fullmatch(r"-?\d+", token):
                return int(token)
            if token in ("A", "T", "P"):
                take("[")
                left = parse_value(x_value)
                take(",")
                right = parse_value(x_value)
                take("]")
                if token == "A":
                    return left + right
                if token == "T":
                    return left * right
                return left ** right
            raise ValueError(f"使用できないトークン: {token}")

        def evaluate(x_value):
            nonlocal index
            index = 0
            value = parse_value(x_value)
            if index != len(tokens):
                raise ValueError("式の末尾に余分なトークンがあります")
            return value

        return evaluate
    xs = [Fraction(v) for v in (-3, -1, 0, 1, 2, 5, Fraction(1, 2))]
    only_one_correct("kosen-math-2025-b4-02",
                     lambda c: all(parse_prog(c)(x) == (2 * x + 3) ** 4 for x in xs))
    check("kosen-math-2025-b4-02", "ⓘ " + chosen("kosen-math-2025-b4-02"), OFFICIAL_R7["4-2"],
          value=chosen("kosen-math-2025-b4-02"))

    # 大問4(4): 数列 A[0,3], A[A[0,3],3], ... の50番目
    v = 0
    for _ in range(50):
        v = A(v, 3)
    only_one_correct("kosen-math-2025-b4-04", lambda c: int(c) == v)
    check("kosen-math-2025-b4-04", str(v), OFFICIAL_R7["4-4"], value=chosen("kosen-math-2025-b4-04"))

    # --- 令和8年度(公式正解表は未入手。独立計算のみ) ---
    # 大問2(2): nが偶数の格子点数の式。全探索と各候補式を比較。
    evens = range(2, 41, 2)
    cand = {
        "n＋4": lambda n: n + 4, "3n/2＋4": lambda n: Fraction(3 * n, 2) + 4,
        "2n＋3": lambda n: 2 * n + 3, "3n＋1": lambda n: 3 * n + 1,
    }
    good = [name for name, fn in cand.items() if all(fn(n) == lattice_count(n) for n in evens)]
    q = qs["kosen-math-2026-b2-01"]
    if good != [q["choices"][q["answer"]]]:
        problems.append(f"kosen-math-2026-b2-01: 全探索と一致する式={good}、登録={q['choices'][q['answer']]}")
    check("kosen-math-2026-b2-01", "3n/2+4 (n=2..40の偶数で全探索と一致)")

    # 大問2(1)相当: n=6
    only_one_correct("kosen-math-2026-b2-02", lambda c: int(c.replace("個", "")) == lattice_count(6))
    check("kosen-math-2026-b2-02", str(lattice_count(6)))

    # 大問3(1): Aさんは80秒でQ→Pを走る(30秒+50秒)。速さ240/80。30秒後の位置。
    speed_a = Fraction(240, 30 + 50)
    meet = 240 - speed_a * 30
    only_one_correct("kosen-math-2026-b3-01", lambda c: int(c.replace("m", "")) == meet)
    check("kosen-math-2026-b3-01", f"{meet}m")

    # 大問4(1): 切り口は六角形(平面と交わる辺が6本、頂点は平面上にない)
    n_edges, on_vertex = cube_section_edges()
    shape = {3: "三角形", 4: "四角形", 5: "五角形", 6: "六角形"}[n_edges]
    if on_vertex:
        problems.append(f"kosen-math-2026-b4-01: 平面が頂点を通る {on_vertex}。辺の数え方を再検討")
    only_one_correct("kosen-math-2026-b4-01", lambda c: c == shape)
    check("kosen-math-2026-b4-01", f"{shape}(交わる辺{n_edges}本)")

    # 大問3(2): y=ax^2、30秒で150m
    a_bus = Fraction(150, 30 ** 2)
    only_one_correct("kosen-math-2026-b3-02", lambda c: Fraction(c) == a_bus)
    check("kosen-math-2026-b3-02", str(a_bus))
    # 整合: a=1/6 なら24mに到達するのは12秒後(β版3-03の前提)
    t2 = 24 / a_bus  # 24 = a x^2 → x^2 = 144
    t24 = isqrt(int(t2)) if t2.denominator == 1 else None
    if t24 != 12 or t24 * t24 != t2:
        problems.append(f"kosen-math-2026-b3-03: a=1/6 で24mに達する時刻={t24}(前提の12秒と不一致)")

    # 大問3(3): Bさんは6m先から12秒で24m地点
    speed_b = Fraction(24 - 6, 12)
    only_one_correct("kosen-math-2026-b3-03", lambda c: Fraction(c.replace("m", "")) == speed_b)
    check("kosen-math-2026-b3-03", f"{float(speed_b)}m/s")

    # 登録された正答が選択肢の中で重複・位置偏りしていないか(参考表示)
    pos = [q["answer"] for q in qs.values()]

    print("数学β版 正答の独立検証\n")
    for qid, comp, off, note, match in results:
        if match is False:
            problems.append(f"{qid}: 登録された正答が公式正解表({off})と不一致")
        mark = "公式正解表と一致" if match else ("公式正解表と【不一致】" if match is False else "独立計算のみ")
        print(f"  {qid:26} 計算結果={comp:28} [{mark}]" + (f"  ※{note}" if note else ""))
    print(f"\n正解位置の分布(0〜3番目): {[pos.count(i) for i in range(4)]}")
    if problems:
        print("\n不一致・要確認:")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print(f"\n13問すべて: 条件を満たす選択肢がちょうど1つで、登録された正答と一致({len(results)}件を計算)")


if __name__ == "__main__":
    main()
