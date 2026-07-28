---
title: SQL Server 批量添加数据
date: 2026-07-20 17:02:00
tags:
  - SQL Server
  - 数据库运维
categories:
  - 数据库
---




配置子服务器下多个用户实例数据 01 OCC 02 fdserver 03  04 评价系统
-- ============================================================
-- 1. 备份表（强烈建议）
-- ============================================================
SELECT * INTO dbo.SystemInfo_Backup_90300_90399 FROM dbo.SystemInfo;

-- ============================================================
-- 2. 设置固定起始端口（端口将从 61001 开始）
-- ============================================================
DECLARE @StartPort INT = 61000;   -- 实际端口为 @StartPort + n，n从1开始

-- ============================================================
-- 3. 开启事务（便于回滚）
-- ============================================================
BEGIN TRANSACTION;

-- ============================================================
-- 4. 生成 400 条记录（100个实例 × 4条）
--    实例号从 90300 到 90399
-- ============================================================
WITH Numbers AS (
    SELECT TOP 400 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.objects a 
    CROSS JOIN sys.objects b   -- 若不够可再加 CROSS JOIN sys.objects c
)
INSERT INTO dbo.SystemInfo (
    ID, SystemID, Name, Remark, McastList, Address,
    RecordTime, Status, port, address_udp, port_udp,
    IsKeySubSystem, 位置X0, 位置Y0, 位置X1, 位置Y1,
    显示图片, InitStatus, ip, UnitNo, SystemType, SystemSubType
)
SELECT
    NULL,   -- 假设 ID 为自增列
    (90300 + (n - 1) / 4) * 100 + ((n - 1) % 4 + 1) AS SystemID,
    N'服务实例:' + CAST((90300 + (n - 1) / 4) AS NVARCHAR(10)) + N'_索引:' + CAST(((n - 1) % 4 + 1) AS NVARCHAR(10)),
    NULL, NULL, NULL, NULL, NULL,
    @StartPort + n,   -- 端口从 61001 开始连续分配（61001, 61002, ... 61400）
    NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL,
    '10.1.12.132',
    NULL, NULL, NULL
FROM Numbers
ORDER BY n;

-- ============================================================
-- 5. 验证插入结果
-- ============================================================
-- 5.1 检查记录总数（应为 400）
SELECT COUNT(*) AS 插入条数
FROM dbo.SystemInfo
WHERE ip = '10.1.12.132' 
  AND SystemID BETWEEN 9030001 AND 9039904;

-- 5.2 检查是否有重复 SystemID（应返回 0 行）
SELECT SystemID, COUNT(*) 
FROM dbo.SystemInfo
WHERE ip = '10.1.12.132' 
  AND SystemID BETWEEN 9030001 AND 9039904
GROUP BY SystemID
HAVING COUNT(*) > 1;

-- 5.3 检查端口是否重复（应返回 0 行）
SELECT port, COUNT(*) 
FROM dbo.SystemInfo
WHERE ip = '10.1.12.132'
GROUP BY port
HAVING COUNT(*) > 1;

-- 5.4 查看端口范围（应是从 61001 到 61400）
SELECT MIN(port) AS 最小端口, MAX(port) AS 最大端口
FROM dbo.SystemInfo
WHERE ip = '10.1.12.132' 
  AND SystemID BETWEEN 9030001 AND 9039904;

-- 5.5 查看前 20 条示例数据
SELECT TOP 20 SystemID, Name, port
FROM dbo.SystemInfo
WHERE ip = '10.1.12.132' 
  AND SystemID BETWEEN 9030001 AND 9039904
ORDER BY SystemID;

-- ============================================================
-- 6. 如果验证无误，提交事务；否则回滚
-- ============================================================
-- 若一切正常，执行：
COMMIT;
-- 若有异常，执行：
-- ROLLBACK;