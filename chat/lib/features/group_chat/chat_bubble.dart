import 'package:chat/features/group_chat/chat_model.dart';
import 'package:flutter/material.dart';

class ChatBubble extends StatelessWidget {
  final String username;
  final MessageResponse message;

  const ChatBubble({
    required this.username,
    required this.message,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    if (message.type == MessageType.TYPING ||
        message.type == MessageType.STOP_TYPING) {
      return const SizedBox();
    }

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
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          crossAxisAlignment: _getCrossAxisAlignment(),
          children: [
            message.from.toLowerCase() != "server"
                ? Text(
                    message.from,
                    style: TextStyle(
                      color: _getTextColor(context).withValues(
                        alpha: 0.8,
                      ),
                      fontSize: 16,
                      overflow: TextOverflow.ellipsis,
                    ),
                    maxLines: 1,
                  )
                : const SizedBox(),
            const SizedBox(height: 2),
            Text(
              _buildMessage(),
              style: TextStyle(
                color: _getTextColor(context),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              _formatTime(DateTime.now()),
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

  String _buildMessage() {
    switch (message.type) {
      case MessageType.MESSAGE:
        return message.content;
      case MessageType.JOIN:
        return message.content;
      case MessageType.LEAVE:
        return message.content;
      default:
        return '';
    }
  }

  Alignment _getAlignment() {
    switch (message.type) {
      case MessageType.MESSAGE:
        // check if the message is from the current user
        if (message.from == username) {
          return Alignment.centerRight;
        }

        return Alignment.centerLeft;
      default:
        return Alignment.center;
    }
  }

  Color _getBubbleColor(BuildContext context) {
    switch (message.type) {
      case MessageType.MESSAGE:
        if (message.from == username) {
          return Theme.of(context).primaryColor;
        } else {
          return Theme.of(context).primaryColorDark;
        }
      default:
        return Colors.grey[200]!;
    }
  }

  BorderRadius _getBorderRadius() {
    switch (message.type) {
      case MessageType.MESSAGE:
        if (message.from == username) {
          return BorderRadius.circular(20)
              .copyWith(bottomRight: const Radius.circular(5));
        } else {
          return BorderRadius.circular(20)
              .copyWith(bottomLeft: const Radius.circular(5));
        }
      default:
        return BorderRadius.circular(20);
    }
  }

  Color _getTextColor(BuildContext context) {
    switch (message.type) {
      case MessageType.MESSAGE:
        return Colors.white;
      default:
        return Colors.black87;
    }
  }

  CrossAxisAlignment _getCrossAxisAlignment() {
    switch (message.type) {
      case MessageType.MESSAGE:
        if (message.from == username) {
          return CrossAxisAlignment.end;
        } else {
          return CrossAxisAlignment.start;
        }
      default:
        return CrossAxisAlignment.center;
    }
  }

  String _formatTime(DateTime timestamp) {
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}
