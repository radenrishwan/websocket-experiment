import 'dart:convert';

import 'package:chat/features/home/api/home_model.dart';
import 'package:http/http.dart' as http;

class HomeApi {
  final String baseUrl;

  HomeApi({this.baseUrl = 'http://localhost:8083/api'});

  Future<RoomResponse> fetchRooms() async {
    final response = await http.get(Uri.parse('$baseUrl/rooms'));

    if (response.statusCode == 200) {
      return RoomResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load rooms');
    }
  }

  Future<ClientResponse> fetchClients() async {
    final response = await http.get(Uri.parse('$baseUrl/clients'));

    if (response.statusCode == 200) {
      return ClientResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load clients');
    }
  }
}
