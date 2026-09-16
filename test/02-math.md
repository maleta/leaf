# Math

KaTeX, bundled offline.

## Inline

Euler's identity $e^{i\pi} + 1 = 0$ sits in running text without breaking the
line height, and so does a fraction like $\tfrac{3}{4}$ or a sum
$\sum_{k=1}^{n} k = \tfrac{n(n+1)}{2}$.

## Display

$$
\frac{\partial}{\partial t}\Psi(\mathbf{r}, t)
= \frac{i\hbar}{2m}\nabla^2\Psi(\mathbf{r}, t)
- \frac{i}{\hbar}V(\mathbf{r})\Psi(\mathbf{r}, t)
$$

## Matrices

$$
A = \begin{bmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{bmatrix}
\qquad
\det(A - \lambda I) = 0
$$

## Aligned

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\varepsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## Cases

$$
\mathrm{sgn}(x) =
\begin{cases}
-1 & \text{if } x < 0 \\
0 & \text{if } x = 0 \\
1 & \text{if } x > 0
\end{cases}
$$

## In a table

| Name | Formula | Value |
| --- | --- | --- |
| Golden ratio | $\varphi = \frac{1+\sqrt{5}}{2}$ | 1.618… |
| Euler–Mascheroni | $\gamma = \lim_{n\to\infty}\left(\sum_{k=1}^{n}\frac{1}{k} - \ln n\right)$ | 0.577… |
| Basel | $\sum_{n=1}^{\infty}\frac{1}{n^2} = \frac{\pi^2}{6}$ | 1.644… |
