class Room {
  final String name;
  final int count;
  final String lastMessage;

  Room({required this.name, required this.count, required this.lastMessage});

  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      name: json['name'],
      count: json['count'],
      lastMessage: json['last_message'],
    );
  }
}

class RoomResponse {
  final int count;
  final List<Room> rooms;

  RoomResponse({required this.count, required this.rooms});

  factory RoomResponse.fromJson(Map<String, dynamic> json) {
    return RoomResponse(
      count: json['count'],
      rooms: List<Room>.from(json['rooms'].map((room) => Room.fromJson(room))),
    );
  }
}

class Client {
  final String id;
  final String name;
  final int connectAt;

  Client({required this.id, required this.name, required this.connectAt});

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id'],
      name: json['name'],
      connectAt: json['connect_at'],
    );
  }
}

class ClientResponse {
  final int count;
  final List<Client> clients;

  ClientResponse({required this.count, required this.clients});

  factory ClientResponse.fromJson(Map<String, dynamic> json) {
    return ClientResponse(
      count: json['count'],
      clients: List<Client>.from(
          json['clients'].map((client) => Client.fromJson(client))),
    );
  }
}
