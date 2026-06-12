package com.collective.app.ui.brand

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.collective.app.R
import com.collective.app.ui.theme.CollectiveTokens

/**
 * The Collective mark: a wide open C wrapping three people over an open book —
 * collective learning, shared practice, proof, and contribution.
 *
 * The shape lives once as a vector drawable (res/drawable/ic_collective_mark.xml)
 * and is rendered here so the in-app logo, empty states, splash, success mark and
 * the launcher icon all stay identical. [color] re-tints the flat-gold artwork, so
 * a white/reversed mark is just `color = Color.White`.
 */
@Composable
fun CollectiveMark(
    modifier: Modifier = Modifier,
    color: Color = CollectiveTokens.Gold,
    width: Dp = 120.dp,
    height: Dp = 120.dp,
    contentDescription: String? = "Collective logo",
) {
    val semanticsModifier = if (contentDescription == null) {
        Modifier
    } else {
        Modifier.semantics { this.contentDescription = contentDescription }
    }
    Box(
        modifier = modifier.size(width, height).then(semanticsModifier),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_collective_mark),
            contentDescription = null,
            colorFilter = ColorFilter.tint(color),
            contentScale = ContentScale.Fit,
            modifier = Modifier.size(minOf(width, height)),
        )
    }
}

/**
 * Smaller, square mark for headers, sheets and chips. Below ~44dp it swaps to a
 * simplified glyph (C + three people, no book) so it stays legible at tiny sizes.
 */
@Composable
fun CollectiveMiniMark(
    modifier: Modifier = Modifier,
    color: Color = CollectiveTokens.Gold,
    size: Dp = 40.dp,
    contentDescription: String? = "Collective logo",
) {
    val semanticsModifier = if (contentDescription == null) {
        Modifier
    } else {
        Modifier.semantics { this.contentDescription = contentDescription }
    }
    val drawable = if (size < 44.dp) {
        R.drawable.ic_collective_mark_mini
    } else {
        R.drawable.ic_collective_mark
    }
    Box(
        modifier = modifier.size(size).then(semanticsModifier),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(drawable),
            contentDescription = null,
            colorFilter = ColorFilter.tint(color),
            contentScale = ContentScale.Fit,
            modifier = Modifier.size(size),
        )
    }
}
