// ignore: constant_identifier_names
enum MessageType { MESSAGE, JOIN, LEAVE, TYPING, STOP_TYPING }

class MessageResponse {
  final MessageType type;
  final String from;
  final String to;
  final String content;

  MessageResponse({
    required this.type,
    required this.from,
    required this.to,
    required this.content,
  });

  factory MessageResponse.fromJson(Map<String, dynamic> json) {
    return MessageResponse(
      type: MessageType.values[json['type']],
      from: json['from'],
      to: json['to'],
      content: json['content'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.index,
      'from': from,
      'to': to,
      'content': content,
    };
  }

  @override
  String toString() {
    return 'MessageResponse{type: $type, from: $from, to: $to, content: $content}';
  }
}
