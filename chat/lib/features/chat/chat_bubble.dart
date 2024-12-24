import 'package:flutter/material.dart';

enum ChatBubbleType { me, other, system }

class ChatBubble extends StatelessWidget {
  final String message;
  final ChatBubbleType type;
  final DateTime timestamp;

  const ChatBubble({
    super.key,
    required this.message,
    required this.type,
    required this.timestamp,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: _getAlignment(),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: _getBubbleColor(context),
          borderRadius: _getBorderRadius(),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(
          crossAxisAlignment: _getCrossAxisAlignment(),
          children: [
            Text(
              "sample",
              style: TextStyle(
                color: _getTextColor(context).withValues(
                  alpha: 0.8,
                ),
                fontSize: 16,
              ),
            ),
            Text(
              message,
              style: TextStyle(
                color: _getTextColor(context),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(timestamp),
              style: TextStyle(
                color: _getTextColor(context).withValues(
                  alpha: 0.5,
                ),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Alignment _getAlignment() {
    switch (type) {
      case ChatBubbleType.me:
        return Alignment.centerRight;
      case ChatBubbleType.other:
        return Alignment.centerLeft;
      case ChatBubbleType.system:
        return Alignment.center;
    }
  }

  Color _getBubbleColor(BuildContext context) {
    switch (type) {
      case ChatBubbleType.me:
        return Theme.of(context).primaryColor;
      case ChatBubbleType.other:
        return Colors.grey[300]!;
      case ChatBubbleType.system:
        return Colors.grey[200]!;
    }
  }

  BorderRadius _getBorderRadius() {
    switch (type) {
      case ChatBubbleType.me:
        return BorderRadius.circular(20)
            .copyWith(bottomRight: const Radius.circular(5));
      case ChatBubbleType.other:
        return BorderRadius.circular(20)
            .copyWith(bottomLeft: const Radius.circular(5));
      case ChatBubbleType.system:
        return BorderRadius.circular(20);
    }
  }

  Color _getTextColor(BuildContext context) {
    switch (type) {
      case ChatBubbleType.me:
        return Colors.white;
      case ChatBubbleType.other:
      case ChatBubbleType.system:
        return Colors.black87;
    }
  }

  CrossAxisAlignment _getCrossAxisAlignment() {
    switch (type) {
      case ChatBubbleType.me:
        return CrossAxisAlignment.end;
      case ChatBubbleType.other:
        return CrossAxisAlignment.start;
      case ChatBubbleType.system:
        return CrossAxisAlignment.center;
    }
  }

  String _formatTime(DateTime timestamp) {
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}
