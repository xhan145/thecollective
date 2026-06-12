package com.collective.app.ai.visualization

import com.collective.app.ui.theme.CollectiveTokens
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.collective.app.ai.model.AiReasoningTrace

@Composable
fun LocalNeuralTraceView(trace: AiReasoningTrace, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("How this suggestion was formed", style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
        NeuralNetCanvas(trace = trace)
        trace.inputSignals.take(3).forEach { signal ->
            Text(
                "${signal.name.replace('_', ' ')}: ${signal.evidence}",
                style = MaterialTheme.typography.bodyMedium,
                color = CollectiveTokens.Muted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            trace.activatedPrinciples.take(2).forEach {
                Text(it, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Gold, maxLines = 1)
            }
        }
    }
}

@Composable
private fun NeuralNetCanvas(trace: AiReasoningTrace) {
    val signals = trace.inputSignals.ifEmpty {
        listOf(
            com.collective.app.ai.model.AiSignal("input", "No text yet", 0.35),
            com.collective.app.ai.model.AiSignal("safety", "Default guardrails", 0.65),
        )
    }.take(4)
    Canvas(modifier = Modifier.fillMaxWidth().height(118.dp)) {
        val inputX = size.width * 0.12f
        val hiddenX = size.width * 0.5f
        val outputX = size.width * 0.88f
        val top = size.height * 0.18f
        val gap = size.height * 0.22f
        val inputNodes = signals.mapIndexed { index, signal ->
            Offset(inputX, top + index * gap) to signal.weight.toFloat().coerceIn(0.2f, 1f)
        }
        val hiddenNodes = listOf(
            Offset(hiddenX, size.height * 0.28f),
            Offset(hiddenX, size.height * 0.58f),
            Offset(hiddenX, size.height * 0.82f),
        )
        val outputNode = Offset(outputX, size.height * 0.55f)

        inputNodes.forEach { (input, weight) ->
            hiddenNodes.forEach { hidden ->
                drawLine(
                    color = CollectiveTokens.Gold.copy(alpha = 0.12f + (weight * 0.22f)),
                    start = input,
                    end = hidden,
                    strokeWidth = 2.2f,
                    cap = StrokeCap.Round,
                )
            }
        }
        hiddenNodes.forEachIndexed { index, hidden ->
            drawLine(
                color = CollectiveTokens.GoldDeep.copy(alpha = 0.2f + index * 0.1f),
                start = hidden,
                end = outputNode,
                strokeWidth = 2.4f,
                cap = StrokeCap.Round,
            )
        }
        inputNodes.forEach { (node, weight) ->
            drawCircle(CollectiveTokens.GoldSoft, radius = 8.dp.toPx() + weight * 4.dp.toPx(), center = node)
            drawCircle(CollectiveTokens.Gold, radius = 3.5.dp.toPx(), center = node)
        }
        hiddenNodes.forEach {
            drawCircle(Color.White, radius = 12.dp.toPx(), center = it)
            drawCircle(CollectiveTokens.GoldBright, radius = 5.dp.toPx(), center = it)
        }
        drawCircle(CollectiveTokens.Gold, radius = 15.dp.toPx(), center = outputNode)
        drawCircle(Color.White, radius = 5.dp.toPx(), center = outputNode)
    }
}
