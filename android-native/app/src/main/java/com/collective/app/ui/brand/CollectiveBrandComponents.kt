package com.collective.app.ui.brand

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun CollectiveWordmark(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        CollectiveMiniMark(size = 26.dp, contentDescription = null)
        Text(
            text = CollectiveBrand.Name,
            color = CollectiveTokens.Text,
            fontSize = 22.sp,
            lineHeight = 25.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
fun CollectiveBrandHeader(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        CollectiveMiniMark(size = 34.dp, contentDescription = "Collective")
        Text(
            text = title,
            color = CollectiveTokens.Text,
            fontSize = 24.sp,
            lineHeight = 28.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = subtitle,
            color = CollectiveTokens.Muted,
            fontSize = 14.sp,
            lineHeight = 19.sp,
        )
    }
}

@Composable
fun CollectiveSheetHeader(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        CollectiveMiniMark(size = 32.dp, contentDescription = "Collective")
        Text(
            text = title,
            color = CollectiveTokens.Text,
            fontSize = 22.sp,
            lineHeight = 27.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        subtitle?.let {
            Text(
                text = it,
                color = CollectiveTokens.Muted,
                fontSize = 14.sp,
                lineHeight = 20.sp,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
fun CollectiveSuccessMark(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(92.dp)
            .clip(CircleShape)
            .background(CollectiveTokens.GoldSoft),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "\u2713",
            color = CollectiveTokens.GoldBright,
            fontSize = 44.sp,
            lineHeight = 48.sp,
            fontWeight = FontWeight.Light,
        )
    }
}

@Composable
fun CollectiveWatermark(
    modifier: Modifier = Modifier,
    color: Color = CollectiveTokens.Gold.copy(alpha = 0.10f),
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .background(CollectiveTokens.GoldSoft.copy(alpha = 0.45f))
            .padding(horizontal = 18.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        CollectiveMiniMark(color = color, size = 58.dp, contentDescription = null)
    }
}
