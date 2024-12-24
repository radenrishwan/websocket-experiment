import 'dart:convert';
import 'dart:developer';

import 'package:chat/features/group_chat/chat_bubble.dart';
import 'package:chat/features/group_chat/chat_model.dart';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class GroupScreen extends StatefulWidget {
  final String title;
  final String username;

  const GroupScreen({super.key, required this.title, required this.username});

  @override
  State<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends State<GroupScreen> {
  late final WebSocketChannel channel;

  final TextEditingController _messageController = TextEditingController();
  final controllerNode = FocusNode();

  final List<MessageResponse> _messages = [];
  final ScrollController _scrollController = ScrollController();

  var onTyping = false;
  MessageResponse? messageTyping;

  @override
  void initState() {
    super.initState();
    channel = WebSocketChannel.connect(
      Uri.parse(
          'ws://localhost:8083/ws?name=${widget.username}&room=${widget.title}'),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      setState(() {
        channel.sink.add(jsonEncode(
          MessageResponse(
            type: MessageType.MESSAGE,
            content: _messageController.text,
            from: widget.username,
            to: widget.title,
          ).toJson(),
        ));
      });

      _messageController.clear();
      _scrollToBottom();
    }
  }

  void _sendTypingStatus() {
    channel.sink.add(jsonEncode(
      MessageResponse(
        type: MessageType.TYPING,
        from: widget.username,
        to: widget.title,
        content: '',
      ).toJson(),
    ));
  }

  void _sendStopTypingStatus() {
    channel.sink.add(jsonEncode(
      MessageResponse(
        type: MessageType.STOP_TYPING,
        from: widget.username,
        to: widget.title,
        content: '',
      ).toJson(),
    ));
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder(
              stream: channel.stream,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return const Center(child: Text('Error'));
                }

                if (snapshot.hasData) {
                  final message =
                      MessageResponse.fromJson(jsonDecode(snapshot.data!));
                  log(message.toString());

                  if (message.type == MessageType.TYPING) {
                    onTyping = true;
                    messageTyping = message;
                  } else if (message.type == MessageType.STOP_TYPING) {
                    onTyping = false;
                  } else {
                    _messages.add(
                        MessageResponse.fromJson(jsonDecode(snapshot.data!)));
                    _scrollToBottom();
                  }
                }

                return Stack(
                  children: [
                    onTyping
                        ? Container(
                            padding: const EdgeInsets.all(8),
                            color: Colors.black12,
                            width: double.infinity,
                            child: Text("${messageTyping!.from} is typing..."),
                          )
                        : const SizedBox(),
                    ListView.builder(
                      padding: const EdgeInsets.all(8),
                      controller: _scrollController,
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final message = _messages[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: ChatBubble(
                            message: message,
                            username: widget.username,
                          ),
                        );
                      },
                    ),
                  ].reversed.toList(),
                );
              },
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  offset: const Offset(0, -2),
                  blurRadius: 4,
                  color: Colors.black.withValues(alpha: 0.1),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      focusNode: controllerNode,
                      onChanged: (value) {
                        if (value.trim().isNotEmpty) {
                          _sendTypingStatus();
                        } else {
                          _sendStopTypingStatus();
                        }
                      },
                      onSubmitted: (value) {
                        _sendStopTypingStatus();
                        _sendMessage();

                        controllerNode.requestFocus();
                      },
                      decoration: InputDecoration(
                        hintText: 'Type a message',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey[200],
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 10,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      _sendStopTypingStatus();
                      _sendMessage();

                      controllerNode.requestFocus();
                    },
                    icon: const Icon(Icons.send),
                    color: Theme.of(context).primaryColor,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
