#!/usr/bin/env python3
"""令和8年度 数学(公式正解表なし)の、計算で決まる設問の答えを独立に求める。

出力は analysis の selfComputed の根拠。公式正解表と照合できたものではない。
図形の読み取りが必要で確定できなかった設問(1(7), 4(4), 4(5))は計算しない。
標準ライブラリのみ。
"""
from fractions import Fraction
from itertools import product
from math import isqrt


def lattice_total(n):
    pts = [(0, 0), (3, 0), (1, n)]
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    tot = inner = 0
    for x, y in product(range(0, 4), range(0, n + 1)):
        d = [cr(pts[i], pts[(i + 1) % 3], (x, y)) for i in range(3)]
        if all(v >= 0 for v in d) or all(v <= 0 for v in d):
            tot += 1
            if all(v > 0 for v in d) or all(v < 0 for v in d):
                inner += 1
    return tot, inner


out = {}
# 大問1
out["1(1)"] = Fraction(17, 10) ** 2 - Fraction(34, 10) * Fraction(47, 10) + Fraction(47, 10) ** 2
a = None
for cand in range(-20, 21):
    if (-1) ** 2 + cand * (-1) - 3 == 0:
        a = cand
out["1(2)a"] = a
out["1(2)other root"] = Fraction(-3, 1) / -1  # 解の積 = -3、一方が-1 → もう一方は3
out["1(3)"] = (Fraction(30, -2) - Fraction(30, -5)) / (-2 - (-5))
# 1(4): y=2x^2 の値域が 0<=y<=8 になる x の変域
def rng(lo, hi):
    ys = [Fraction(2) * Fraction(t) ** 2 for t in (lo, hi)] + ([Fraction(0)] if lo <= 0 <= hi else [])
    return min(ys), max(ys)
import math
s2, s5 = math.sqrt(2), math.sqrt(5)
def ok(lo, hi):
    ys = [2 * lo * lo, 2 * hi * hi] + ([0.0] if lo <= 0 <= hi else [])
    return abs(min(ys) - 0) < 1e-9 and abs(max(ys) - 8) < 1e-9
out["1(4)"] = [ok(0, 2), ok(0, s2), ok(-1, 2), ok(-s5, 2)]  # (I)(II)(III)(IV) の正誤
# 1(5)
A_, B_ = [1, 3, 6, 9], [1, 2, 4, 6, 8]
out["1(5)"] = Fraction(sum(1 for a_ in A_ for b_ in B_ if a_ < b_), len(A_) * len(B_))
# 2
out["2(1) n=6,13 total"] = (lattice_total(6)[0], lattice_total(13)[0])
out["2(2) even n total = 3n/2+4"] = all(lattice_total(n)[0] == Fraction(3 * n, 2) + 4 for n in range(2, 60, 2))
out["2(3) total==91"] = [n for n in range(1, 400) if lattice_total(n)[0] == 91]
out["2(4) inner==54"] = [n for n in range(1, 400) if lattice_total(n)[1] == 54]
out["2(5) smallest total>300"] = next(n for n in range(1, 1000) if lattice_total(n)[0] > 300)
# 3: バス y=x^2/6 (a=1/6)、Aさん y=240-3x、Bさん y=6+1.5x
out["3(1)"] = 240 - Fraction(240, 80) * 30
out["3(2) a"] = Fraction(150, 30 ** 2)
out["3(3) B speed"] = Fraction(24 - 6, 12)
# Aさん(240-3x)とBさん(6+3x/2)が出会う位置
x = Fraction(240 - 6) / (3 + Fraction(3, 2))
out["3(3) meet pos"] = (x, 6 + Fraction(3, 2) * x)
# 3(4): バス y=x^2/6。24秒後・36秒後にバイクに追いつく。バイク位置 y=-d+v t
yb24, yb36 = Fraction(24 ** 2, 6), Fraction(36 ** 2, 6)
v = (yb36 - yb24) / 12
d = v * 24 - yb24
out["3(4) bike passes P at t="] = d / v
# 4(1)-(3): 立方体の切断(設問側は verify-math-beta.py にも同じ幾何あり)
# --- 以下は手計算で導いた値の算術確認のみ(幾何の読み取り・推論はスクリプトでは検証していない) ---
# 4(2): 切り口は一辺√2の正六角形(6頂点がすべて辺の中点)。面積 = (3√3/2) * (√2)^2 = 3√3
out["[手計算の算術確認] 4(2) 正六角形の面積/√3"] = Fraction(3, 2) * 2
# 4(3): 平面が立方体の中心(1,1,1)を通る(x-y+z=1)ので2つの部分は等体積 → 8/2
out["[手計算の算術確認] 4(3) 体積"] = 8 // 2
# 1(8): 接線の長さ AD^2 = OD^2 - OA^2、AC^2 = AB^2/2 かつ AB^2+AC^2 = 36
out["[手計算の算術確認] 1(8) AD^2"] = (3 + 6) ** 2 - 3 ** 2
out["[手計算の算術確認] 1(8) AC^2"] = Fraction(36) / Fraction(3, 2) / 2

for k, vv in out.items():
    print(f"{k:50} {vv}")
